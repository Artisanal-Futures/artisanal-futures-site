/**
 * One-time duplicate-product merge.
 *
 * Early product imports ran before `Product.shopProductId` was captured, so
 * re-importing a shop could not match those rows and created a second copy
 * instead. This script finds those clusters and merges each one down to a
 * single keeper.
 *
 * Usage:
 *
 *   pnpm dedupe-products                    # DRY RUN — prints clusters, writes nothing
 *   pnpm dedupe-products --shop <shopId>    # restrict to one shop
 *   pnpm dedupe-products --apply --i-know-this-is-production
 *
 * SAFETY
 *  - Dry run is the default. Writing requires BOTH `--apply` and the explicit
 *    `--i-know-this-is-production` acknowledgement. (Unlike scripts/docs/, this
 *    script's whole purpose is to clean up the real catalog, so it can't use a
 *    localhost-only guard — the acknowledgement flag takes its place.)
 *  - Before any write, every row it is about to touch is dumped to a timestamped
 *    JSON backup in the repo root.
 *  - Losers are HIDDEN (`isPublic = false`), never deleted, so a bad merge is
 *    reversible by flipping the flag back.
 *  - The keeper inherits the union of both rows' categories and tags, so
 *    curation is never lost.
 *
 *  - The target database host is printed before any write, so an --apply run
 *    against the wrong DATABASE_URL is visible before it happens.
 *
 * Matching mirrors the scheduled sync (`src/server/lib/product-sync.ts`): the
 * same normalized-URL then normalized-name keys, so a cluster this script
 * merges is exactly a cluster the sync would otherwise have to disambiguate.
 * The name pass additionally refuses any bucket whose rows point at two
 * different product URLs — see `clusterProducts`.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaClient } from "../generated/prisma";
import {
  normalizeNameKey,
  normalizeUrlKey,
} from "../src/server/lib/product-sync";

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const acknowledged = argv.includes("--i-know-this-is-production");
const shopFilter = argv[argv.indexOf("--shop") + 1];
const onlyShopId = argv.includes("--shop") ? shopFilter : undefined;

if (apply && !acknowledged) {
  console.error(
    "Refusing to write.\n\n" +
      "  --apply also requires --i-know-this-is-production.\n" +
      "  Run without --apply first and read the dry-run output.",
  );
  process.exit(1);
}

if (argv.includes("--shop") && !onlyShopId) {
  console.error("--shop requires a shop id.");
  process.exit(1);
}

type ProductRow = {
  id: string;
  shopId: string | null;
  shopProductId: string | null;
  name: string;
  description: string;
  priceInCents: number | null;
  currency: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: Date;
  scrapeMethod: string;
  tags: string[];
  attributeTags: string[];
  materialTags: string[];
  environmentalTags: string[];
  aiGeneratedTags: string[];
  manualFields: string[];
  categories: { id: string; name: string }[];
};

const TAG_FIELDS = [
  "tags",
  "attributeTags",
  "materialTags",
  "environmentalTags",
  "aiGeneratedTags",
] as const;

/**
 * Score a row's curation so the most-worked-on copy wins. Ties fall back to
 * age — the oldest row is the one other records are most likely to reference.
 */
function curationScore(product: ProductRow): number {
  return (
    product.categories.length * 10 +
    TAG_FIELDS.reduce((sum, field) => sum + product[field].length, 0) +
    product.manualFields.length * 5 +
    (product.shopProductId ? 3 : 0) +
    (product.isPublic ? 2 : 0) +
    (product.imageUrl ? 1 : 0)
  );
}

function pickKeeper(cluster: ProductRow[]): ProductRow {
  return [...cluster].sort((a, b) => {
    const diff = curationScore(b) - curationScore(a);
    if (diff !== 0) return diff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  })[0]!;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((v) => v.trim().length > 0))];
}

/**
 * Group a shop's products into duplicate clusters. URL is tried first (a
 * stronger signal), then name over whatever is left.
 *
 * The name pass is deliberately conservative. Two rows that merely share a name
 * are not evidence of a duplicate — a shop can genuinely sell "Blue Mug" twice
 * — so a name bucket is only accepted when the rows do not disagree about where
 * they point: at most one distinct product URL across the whole bucket, plus
 * the same shop. (Rows that share a URL were already clustered by the first
 * pass, so in practice this means "the URL-less legacy rows, optionally with
 * the one row that has a URL".) A bucket with two different URLs is two
 * different products and is left alone.
 */
function clusterProducts(products: ProductRow[]): ProductRow[][] {
  const clusters: ProductRow[][] = [];
  const assigned = new Set<string>();

  const groupBy = (
    keyOf: (p: ProductRow) => string | null,
    accept: (bucket: ProductRow[]) => boolean = () => true,
  ) => {
    const buckets = new Map<string, ProductRow[]>();
    for (const product of products) {
      if (assigned.has(product.id)) continue;
      const key = keyOf(product);
      if (!key) continue;
      buckets.set(key, [...(buckets.get(key) ?? []), product]);
    }
    for (const bucket of buckets.values()) {
      if (bucket.length < 2) continue;
      if (!accept(bucket)) continue;
      bucket.forEach((p) => assigned.add(p.id));
      clusters.push(bucket);
    }
  };

  groupBy((p) => normalizeUrlKey(p.productUrl));
  groupBy(
    (p) => normalizeNameKey(p.name),
    (bucket) => {
      const urlKeys = new Set(
        bucket
          .map((p) => normalizeUrlKey(p.productUrl))
          .filter((key): key is string => key !== null),
      );
      const shopIds = new Set(bucket.map((p) => p.shopId));
      return urlKeys.size <= 1 && shopIds.size === 1;
    },
  );

  return clusters;
}

type Merge = {
  shopName: string;
  keeper: ProductRow;
  losers: ProductRow[];
  matchedOn: "url" | "name";
  keeperUpdate: {
    shopProductId?: string;
    imageUrl?: string;
    priceInCents?: number;
    productUrl?: string;
    isFeatured?: boolean;
    categoryIds: string[];
    tags: Record<string, string[]>;
  };
};

function planMerge(cluster: ProductRow[], shopName: string): Merge {
  const keeper = pickKeeper(cluster);
  const losers = cluster.filter((p) => p.id !== keeper.id);

  const urlKey = normalizeUrlKey(keeper.productUrl);
  const matchedOn =
    urlKey && losers.every((l) => normalizeUrlKey(l.productUrl) === urlKey)
      ? "url"
      : "name";

  const categoryIds = unique(
    cluster.flatMap((p) => p.categories.map((c) => c.id)),
  );
  const tags: Record<string, string[]> = {};
  for (const field of TAG_FIELDS) {
    const merged = unique(cluster.flatMap((p) => p[field]));
    // Only record a change when the keeper would actually gain something.
    if (merged.length !== keeper[field].length) tags[field] = merged;
  }

  const keeperUpdate: Merge["keeperUpdate"] = { categoryIds, tags };

  if (!keeper.shopProductId) {
    const donor = losers.find((l) => l.shopProductId);
    if (donor?.shopProductId) keeperUpdate.shopProductId = donor.shopProductId;
  }
  if (!keeper.imageUrl) {
    const donor = losers.find((l) => l.imageUrl);
    if (donor?.imageUrl) keeperUpdate.imageUrl = donor.imageUrl;
  }
  if (keeper.priceInCents === null) {
    const donor = losers.find((l) => l.priceInCents !== null);
    if (donor?.priceInCents != null)
      keeperUpdate.priceInCents = donor.priceInCents;
  }
  if (!keeper.productUrl) {
    const donor = losers.find((l) => l.productUrl);
    if (donor?.productUrl) keeperUpdate.productUrl = donor.productUrl;
  }
  if (!keeper.isFeatured && losers.some((l) => l.isFeatured)) {
    keeperUpdate.isFeatured = true;
  }

  return { shopName, keeper, losers, matchedOn, keeperUpdate };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
function describe(merge: Merge) {
  const { keeper, losers, keeperUpdate } = merge;
  console.log(
    `\n  "${keeper.name}"  (${merge.shopName}, matched on ${merge.matchedOn})`,
  );
  console.log(
    `    KEEP  ${keeper.id}  ${keeper.createdAt.toISOString().slice(0, 10)}  ` +
      `${keeper.categories.length} categories, ` +
      `${TAG_FIELDS.reduce((n, f) => n + keeper[f].length, 0)} tags` +
      `${keeper.shopProductId ? `, store id ${keeper.shopProductId}` : ", no store id"}` +
      `${keeper.isPublic ? "" : "  [currently hidden]"}`,
  );
  for (const loser of losers) {
    console.log(
      `    HIDE  ${loser.id}  ${loser.createdAt.toISOString().slice(0, 10)}  ` +
        `${loser.categories.length} categories, ` +
        `${TAG_FIELDS.reduce((n, f) => n + loser[f].length, 0)} tags` +
        `${loser.shopProductId ? `, store id ${loser.shopProductId}` : ", no store id"}` +
        `${loser.isPublic ? "" : "  [already hidden]"}`,
    );
  }

  const gains: string[] = [];
  if (keeperUpdate.shopProductId)
    gains.push(`store id ${keeperUpdate.shopProductId}`);
  if (keeperUpdate.imageUrl) gains.push("an image");
  if (keeperUpdate.priceInCents != null) gains.push("a price");
  if (keeperUpdate.productUrl) gains.push("a product URL");
  if (keeperUpdate.isFeatured) gains.push("featured status");
  if (keeperUpdate.categoryIds.length > keeper.categories.length) {
    gains.push(
      `${keeperUpdate.categoryIds.length - keeper.categories.length} more categories`,
    );
  }
  for (const [field, values] of Object.entries(keeperUpdate.tags)) {
    gains.push(
      `${values.length - (keeper[field as (typeof TAG_FIELDS)[number]]?.length ?? 0)} more ${field}`,
    );
  }
  if (gains.length > 0) {
    console.log(`    keeper gains: ${gains.join(", ")}`);
  }
}

/**
 * Where the writes are about to land, in a form that is safe to print: host and
 * port from `DATABASE_URL`, never the user, password or the raw string.
 */
function describeDatabaseTarget(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) return "(no DATABASE_URL set)";
  try {
    const { hostname, port } = new URL(raw);
    if (!hostname) return "(DATABASE_URL has no host)";
    return port ? `${hostname}:${port}` : hostname;
  } catch {
    return "(DATABASE_URL could not be parsed)";
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const db = new PrismaClient();

  try {
    const shops = await db.shop.findMany({
      where: onlyShopId ? { id: onlyShopId } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    if (shops.length === 0) {
      console.log("No shops found.");
      return;
    }

    console.log(
      apply
        ? "MODE: APPLY — changes will be written.\n"
        : "MODE: DRY RUN — nothing will be written. Re-run with --apply --i-know-this-is-production to commit.\n",
    );

    const allMerges: Merge[] = [];

    for (const shop of shops) {
      const products = (await db.product.findMany({
        where: { shopId: shop.id },
        select: {
          id: true,
          shopId: true,
          shopProductId: true,
          name: true,
          description: true,
          priceInCents: true,
          currency: true,
          imageUrl: true,
          productUrl: true,
          isPublic: true,
          isFeatured: true,
          createdAt: true,
          scrapeMethod: true,
          tags: true,
          attributeTags: true,
          materialTags: true,
          environmentalTags: true,
          aiGeneratedTags: true,
          manualFields: true,
          categories: { select: { id: true, name: true } },
        },
      })) as ProductRow[];

      const clusters = clusterProducts(products);
      if (clusters.length === 0) continue;

      console.log(
        `\n${shop.name} — ${clusters.length} duplicate cluster${
          clusters.length === 1 ? "" : "s"
        } across ${products.length} products`,
      );
      for (const cluster of clusters) {
        const merge = planMerge(cluster, shop.name);
        describe(merge);
        allMerges.push(merge);
      }
    }

    const totalLosers = allMerges.reduce((n, m) => n + m.losers.length, 0);

    console.log(
      `\n${"=".repeat(60)}\n` +
        `${allMerges.length} clusters, ${totalLosers} products would be hidden and merged into their keeper.`,
    );

    if (allMerges.length === 0) {
      console.log("Nothing to do.");
      return;
    }

    if (!apply) {
      console.log(
        "\nDry run complete. Read the clusters above, then re-run with:\n" +
          "  pnpm dedupe-products --apply --i-know-this-is-production",
      );
      return;
    }

    // Say out loud which database is about to be written to. Host only — the
    // connection string carries credentials and must never be printed.
    console.log(`\nTarget database: ${describeDatabaseTarget()}`);

    // Backup every row about to be touched, before touching any of it.
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = resolve(
      process.cwd(),
      `dedupe-products-backup-${stamp}.json`,
    );
    writeFileSync(
      backupPath,
      JSON.stringify(
        allMerges.map((m) => ({
          shopName: m.shopName,
          matchedOn: m.matchedOn,
          keeper: m.keeper,
          losers: m.losers,
        })),
        null,
        2,
      ),
    );
    console.log(`\nBackup written to ${backupPath}`);

    let merged = 0;
    let hidden = 0;

    for (const merge of allMerges) {
      const { keeper, losers, keeperUpdate } = merge;
      await db.$transaction(async (tx) => {
        // Losers first: free up the (shopId, shopProductId) unique before the
        // keeper claims a backfilled id, or the update would collide.
        for (const loser of losers) {
          await tx.product.update({
            where: { id: loser.id },
            data: {
              isPublic: false,
              // Park the external id so the unique constraint is released and
              // the value is still recoverable from the row itself.
              shopProductId: loser.shopProductId
                ? `merged:${loser.id}:${loser.shopProductId}`
                : null,
            },
          });
          hidden++;
        }

        await tx.product.update({
          where: { id: keeper.id },
          data: {
            ...(keeperUpdate.shopProductId
              ? { shopProductId: keeperUpdate.shopProductId }
              : {}),
            ...(keeperUpdate.imageUrl
              ? { imageUrl: keeperUpdate.imageUrl }
              : {}),
            ...(keeperUpdate.priceInCents != null
              ? { priceInCents: keeperUpdate.priceInCents }
              : {}),
            ...(keeperUpdate.productUrl
              ? { productUrl: keeperUpdate.productUrl }
              : {}),
            ...(keeperUpdate.isFeatured ? { isFeatured: true } : {}),
            ...keeperUpdate.tags,
            categories: {
              set: keeperUpdate.categoryIds.map((id) => ({ id })),
            },
          },
        });
        merged++;
      });
    }

    console.log(
      `\nDone. ${merged} keepers updated, ${hidden} duplicates hidden.\n` +
        `Nothing was deleted — to undo, restore from ${backupPath}.`,
    );
  } finally {
    await db.$disconnect();
  }
}

void main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
