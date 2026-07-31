import type { PrismaClient, Product } from "generated/prisma";
import { $Enums } from "generated/prisma";

import { handleImageUrl } from "~/lib/handle-image-url";
import {
  mapProducts,
  type ProductData,
} from "~/lib/product-import/convert-to-product";
import {
  fetchStoreFeed,
  FETCHABLE_PLATFORMS,
  StoreFeedFormatError,
  StoreUrlError,
  type FetchablePlatform,
} from "~/server/lib/store-feed";
import { SafeFetchError } from "~/server/lib/safe-fetch";

/**
 * Scheduled product sync.
 *
 * `planShopSync` re-reads a shop's storefront and records what *would* change
 * as a `ProductSyncRun` full of proposals. It never writes to the catalog.
 * `applySyncRun` is the separate, admin-triggered step that commits approved
 * proposals.
 *
 * Two invariants hold everywhere in this file:
 *
 *  1. **Curated data is never proposed for change.** Categories, all four tag
 *     arrays and `isFeatured` are AF's own work; they are stripped from every
 *     payload rather than merely skipped at write time (see SYNCED_FIELDS).
 *  2. **Nothing is ever deleted.** A product that vanished from the storefront
 *     becomes a MISSING proposal that, once approved, sets `isPublic = false`.
 */

/** The only product fields the sync is allowed to touch. */
export const SYNCED_FIELDS = [
  "name",
  "description",
  "priceInCents",
  "currency",
  "imageUrl",
  "productUrl",
] as const;

export type SyncedField = (typeof SYNCED_FIELDS)[number];

/**
 * Refuse to plan MISSING proposals when a feed returns less than this fraction
 * of the shop's currently-live synced products. A storefront that briefly
 * serves a partial catalog (a plugin update, a half-finished migration) would
 * otherwise produce a run proposing to hide most of a shop.
 */
export const MIN_FEED_RATIO = 0.5;

export type DiffEntry = {
  field: SyncedField;
  before: string | number | null;
  after: string | number | null;
  /** True when a human edited this field and the sync deliberately left it. */
  protected: boolean;
};

/** A product as normalized from a storefront feed, trimmed to synced fields. */
export type SyncedPayload = {
  name: string;
  description: string;
  priceInCents: number | null;
  currency: string | null;
  imageUrl: string | null;
  productUrl: string | null;
};

export type PlanResult = {
  runId: string;
  status: $Enums.SyncRunStatus;
  fetchedCount: number;
  created: number;
  updated: number;
  missing: number;
  errorMessage?: string;
};

// --- Matching helpers (pure, unit-tested by scripts/test-product-sync.ts) ----

/**
 * Normalize a product URL for fallback matching: drop the scheme, query string,
 * fragment, `www.` and any trailing slash, and lowercase the result. Enough to
 * survive an http→https migration or a tracking parameter without matching two
 * genuinely different products.
 */
export function normalizeUrlKey(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  let working = url.trim();
  try {
    // Relative URLs are stored for some platforms; give them a dummy origin so
    // URL parsing works, then throw the origin away.
    const parsed = new URL(
      /^https?:\/\//i.test(working) ? working : `https://${working}`,
    );
    working = `${parsed.host}${parsed.pathname}`;
  } catch {
    // Not parseable — fall back to the raw string, still normalized below.
  }
  const key = working
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
  return key.length > 0 ? key : null;
}

/** Normalize a product name for fallback matching. */
export function normalizeNameKey(
  name: string | null | undefined,
): string | null {
  if (!name?.trim()) return null;
  const key = name.trim().toLowerCase().replace(/\s+/g, " ");
  return key.length > 0 ? key : null;
}

/** Build a lookup index over a shop's existing products. */
export function buildMatchIndex(products: Pick<
  Product,
  "id" | "shopProductId" | "productUrl" | "name"
>[]) {
  const byExternalId = new Map<string, string>();
  const byUrl = new Map<string, string[]>();
  const byName = new Map<string, string[]>();

  for (const product of products) {
    if (product.shopProductId) {
      byExternalId.set(product.shopProductId, product.id);
    }
    const urlKey = normalizeUrlKey(product.productUrl);
    if (urlKey) byUrl.set(urlKey, [...(byUrl.get(urlKey) ?? []), product.id]);
    const nameKey = normalizeNameKey(product.name);
    if (nameKey)
      byName.set(nameKey, [...(byName.get(nameKey) ?? []), product.id]);
  }
  return { byExternalId, byUrl, byName };
}

export type MatchIndex = ReturnType<typeof buildMatchIndex>;
export type MatchResult = {
  productId: string;
  matchedBy: "shopProductId" | "productUrl" | "name";
} | null;

/**
 * Find the local product an incoming storefront product corresponds to.
 *
 * Tried in order of confidence. The two fallbacks exist because early imports
 * ran before `shopProductId` was populated, so those rows can never match on
 * the fast path and would otherwise be re-created as duplicates every week.
 * Approving such a match backfills the external id, so subsequent syncs match
 * on the first tier.
 *
 * An ambiguous fallback (the same URL or name on more than one local row) is
 * deliberately *not* matched — those are pre-existing duplicates for the dedupe
 * script to resolve, and silently picking one would entrench the wrong row.
 */
export function matchIncoming(
  incoming: { shopProductId: string; productUrl: string | null; name: string },
  index: MatchIndex,
  claimed: Set<string>,
): MatchResult {
  const byId = index.byExternalId.get(incoming.shopProductId);
  if (byId && !claimed.has(byId)) {
    return { productId: byId, matchedBy: "shopProductId" };
  }

  const urlKey = normalizeUrlKey(incoming.productUrl);
  if (urlKey) {
    const candidates = (index.byUrl.get(urlKey) ?? []).filter(
      (id) => !claimed.has(id),
    );
    if (candidates.length === 1) {
      return { productId: candidates[0]!, matchedBy: "productUrl" };
    }
  }

  const nameKey = normalizeNameKey(incoming.name);
  if (nameKey) {
    const candidates = (index.byName.get(nameKey) ?? []).filter(
      (id) => !claimed.has(id),
    );
    if (candidates.length === 1) {
      return { productId: candidates[0]!, matchedBy: "name" };
    }
  }

  return null;
}

// --- Diffing ----------------------------------------------------------------

function normalizeValue(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  // Only strings and numbers ever reach here (the synced fields are all scalar);
  // anything else is a data bug, so treat it as absent rather than stringifying
  // it into "[object Object]" and proposing that as a change.
  if (typeof value !== "string") return null;
  const str = value.trim();
  return str.length > 0 ? str : null;
}

/**
 * Compare an incoming payload against the local row over the synced fields.
 * Fields a human has edited (`product.manualFields`) are reported with
 * `protected: true` and are never applied.
 */
export function buildDiff(
  existing: Pick<Product, SyncedField | "manualFields">,
  incoming: SyncedPayload,
): DiffEntry[] {
  const manual = new Set(existing.manualFields ?? []);
  const entries: DiffEntry[] = [];

  for (const field of SYNCED_FIELDS) {
    const before = normalizeValue(existing[field]);
    const after = normalizeValue(incoming[field]);
    if (before === after) continue;
    // Never propose blanking a field we already have because the source went
    // quiet — that is almost always a feed hiccup, not an intentional deletion.
    if (after === null) continue;
    entries.push({ field, before, after, protected: manual.has(field) });
  }
  return entries;
}

/** The subset of a diff that would actually be written. */
export function applicableDiff(diff: DiffEntry[]): DiffEntry[] {
  return diff.filter((entry) => !entry.protected);
}

// --- Planning ---------------------------------------------------------------

export type ShopSyncConfig = {
  id: string;
  name: string;
  website: string | null;
  syncUrl: string | null;
  syncPlatform: $Enums.ProductScrapeMethod | null;
  syncEnabled: boolean;
  allowInsecureOrigin: boolean;
  logoPhoto: string | null;
};

/** Map the Prisma platform enum onto the fetchable platform strings. */
export function toFetchablePlatform(
  platform: $Enums.ProductScrapeMethod | null,
): FetchablePlatform | null {
  if (!platform) return null;
  const lower = platform.toLowerCase();
  return FETCHABLE_PLATFORMS.includes(lower as FetchablePlatform)
    ? (lower as FetchablePlatform)
    : null;
}

/**
 * Resolve the shop logo used as a product's fallback image. Mirrors the
 * wizard's handling, including the literal "null"/"undefined" strings that
 * `shop.getAll` can produce.
 */
export function resolveShopLogo(logoPhoto: string | null): string | undefined {
  if (!logoPhoto || ["null", "undefined", ""].includes(logoPhoto.trim())) {
    return undefined;
  }
  return logoPhoto.startsWith("http") ? logoPhoto : handleImageUrl(logoPhoto);
}

export class SyncNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncNotConfiguredError";
  }
}

export class SyncAlreadyPendingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncAlreadyPendingError";
  }
}

/**
 * Re-read a shop's storefront and record the changes it would imply as a
 * `ProductSyncRun`. Writes nothing to the catalog.
 */
export async function planShopSync(
  db: PrismaClient,
  shopId: string,
  opts: {
    triggeredManually?: boolean;
    /**
     * Seam for tests: swap the network fetch for a canned feed. Production
     * callers leave this unset and get `fetchStoreFeed`.
     */
    fetchFeed?: typeof fetchStoreFeed;
  } = {},
): Promise<PlanResult> {
  const fetchFeed = opts.fetchFeed ?? fetchStoreFeed;

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true,
      name: true,
      website: true,
      syncUrl: true,
      syncPlatform: true,
      syncEnabled: true,
      allowInsecureOrigin: true,
      logoPhoto: true,
    },
  });

  if (!shop) {
    throw new SyncNotConfiguredError(`Shop ${shopId} not found.`);
  }
  if (!shop.syncEnabled) {
    throw new SyncNotConfiguredError(
      `Sync is not enabled for "${shop.name}". Turn it on in the shop's sync settings.`,
    );
  }

  const platform = toFetchablePlatform(shop.syncPlatform);
  if (!platform) {
    throw new SyncNotConfiguredError(
      `"${shop.name}" has no automatically syncable platform set. Square and manual shops must be imported by hand.`,
    );
  }

  const website = shop.syncUrl?.trim() ?? shop.website?.trim();
  if (!website) {
    throw new SyncNotConfiguredError(
      `"${shop.name}" has no store URL on file.`,
    );
  }

  // Don't stack review queues week over week — one pending run per shop.
  const pending = await db.productSyncRun.findFirst({
    where: { shopId, status: $Enums.SyncRunStatus.PENDING_REVIEW },
    select: { id: true },
  });
  if (pending) {
    throw new SyncAlreadyPendingError(
      `"${shop.name}" already has a sync waiting for review. Review or discard it first.`,
    );
  }

  const run = await db.productSyncRun.create({
    data: {
      shopId,
      platform: shop.syncPlatform!,
      status: $Enums.SyncRunStatus.RUNNING,
      triggeredManually: opts.triggeredManually ?? false,
    },
    select: { id: true },
  });

  const fail = async (message: string, fetchedCount = 0): Promise<PlanResult> => {
    await db.productSyncRun.update({
      where: { id: run.id },
      data: {
        status: $Enums.SyncRunStatus.FAILED,
        errorMessage: message,
        finishedAt: new Date(),
        fetchedCount,
      },
    });
    return {
      runId: run.id,
      status: $Enums.SyncRunStatus.FAILED,
      fetchedCount,
      created: 0,
      updated: 0,
      missing: 0,
      errorMessage: message,
    };
  };

  // 1. Fetch the storefront feed.
  let feed: Awaited<ReturnType<typeof fetchStoreFeed>>;
  try {
    feed = await fetchFeed({
      website,
      platform,
      allowInsecureOrigin: shop.allowInsecureOrigin,
    });
  } catch (err) {
    if (
      err instanceof SafeFetchError ||
      err instanceof StoreUrlError ||
      err instanceof StoreFeedFormatError
    ) {
      return fail(err.message);
    }
    if (err instanceof SyntaxError) {
      return fail(
        "The store responded but the data wasn't in the expected format.",
      );
    }
    console.error(`[product-sync] Feed fetch failed for shop ${shopId}:`, err);
    return fail(
      err instanceof Error ? err.message : "Unknown error fetching the store.",
    );
  }

  // 2. Normalize with the same parser the manual wizard uses.
  let incomingRaw: Awaited<ReturnType<typeof mapProducts>>;
  try {
    incomingRaw = await mapProducts({
      parsedJson: JSON.parse(feed.json) as ProductData,
      selectedSource: platform,
      selectedShopId: shopId,
      selectedSiteUrl: new URL(
        /^https?:\/\//i.test(website) ? website : `https://${website}`,
      ).origin,
      fallbackImageUrl: resolveShopLogo(shop.logoPhoto),
    });
  } catch (err) {
    console.error(`[product-sync] Parse failed for shop ${shopId}:`, err);
    return fail(
      "The store's product data couldn't be parsed into products.",
      feed.count,
    );
  }

  // Drop anything without a usable external id or name — we can neither key nor
  // display it.
  const incoming = incomingRaw.filter(
    (p) => !!p.shopProductId?.trim() && !!p.name?.trim(),
  );

  // 3. Load the shop's existing synced products.
  const existingProducts = await db.product.findMany({
    where: {
      shopId,
      scrapeMethod: { not: $Enums.ProductScrapeMethod.MANUAL },
    },
    select: {
      id: true,
      shopProductId: true,
      name: true,
      description: true,
      priceInCents: true,
      currency: true,
      imageUrl: true,
      productUrl: true,
      isPublic: true,
      manualFields: true,
    },
  });
  const existingById = new Map(existingProducts.map((p) => [p.id, p]));

  // 4. Safety guard. A feed that came back empty, or that lost more than half
  //    the live catalog, is treated as suspect: fail the run rather than
  //    propose hiding most of a shop.
  const liveCount = existingProducts.filter((p) => p.isPublic).length;
  if (incoming.length === 0) {
    return fail(
      liveCount > 0
        ? `The store returned no products, but ${liveCount} are currently live on AF. Refusing to plan changes against an empty feed.`
        : "The store returned no products.",
      feed.count,
    );
  }
  if (liveCount > 0 && incoming.length < liveCount * MIN_FEED_RATIO) {
    return fail(
      `The store returned ${incoming.length} products but ${liveCount} are currently live on AF — less than ${Math.round(
        MIN_FEED_RATIO * 100,
      )}%. Refusing to plan changes against a feed this incomplete. Re-run the sync if the catalog really did shrink.`,
      feed.count,
    );
  }

  // 5. Match and diff.
  const index = buildMatchIndex(existingProducts);
  const claimed = new Set<string>();
  const proposals: Array<{
    productId: string | null;
    shopProductId: string;
    changeType: $Enums.SyncChangeType;
    matchedBy: string | null;
    payload: SyncedPayload;
    diff: DiffEntry[];
  }> = [];

  for (const product of incoming) {
    const payload: SyncedPayload = {
      name: product.name,
      description: product.description ?? "",
      priceInCents: product.priceInCents ?? null,
      currency: product.currency ?? null,
      imageUrl: product.imageUrl ?? null,
      productUrl: product.productUrl ?? null,
    };

    const match = matchIncoming(
      {
        shopProductId: product.shopProductId!,
        productUrl: payload.productUrl,
        name: payload.name,
      },
      index,
      claimed,
    );

    if (!match) {
      proposals.push({
        productId: null,
        shopProductId: product.shopProductId!,
        changeType: $Enums.SyncChangeType.CREATE,
        matchedBy: null,
        payload,
        diff: SYNCED_FIELDS.map((field) => ({
          field,
          before: null,
          after: normalizeValue(payload[field]),
          protected: false,
        })).filter((entry) => entry.after !== null),
      });
      continue;
    }

    claimed.add(match.productId);
    const existing = existingById.get(match.productId)!;
    const diff = buildDiff(existing, payload);

    // A fallback match still needs applying even with no field changes, because
    // approving it backfills `shopProductId` and stops the weekly duplicate.
    const needsBackfill =
      match.matchedBy !== "shopProductId" ||
      existing.shopProductId !== product.shopProductId;
    // A product hidden by an earlier sync should come back when it reappears
    // upstream — but one an admin hid by hand stays hidden. `isPublic` lands in
    // `manualFields` only when a human toggled it, which is what distinguishes
    // the two cases.
    const manuallyHidden = existing.manualFields.includes("isPublic");
    const needsUnhide = !existing.isPublic && !manuallyHidden;

    if (
      applicableDiff(diff).length === 0 &&
      !needsBackfill &&
      !needsUnhide
    ) {
      continue;
    }

    proposals.push({
      productId: match.productId,
      shopProductId: product.shopProductId!,
      changeType: $Enums.SyncChangeType.UPDATE,
      matchedBy: match.matchedBy,
      payload,
      diff,
    });
  }

  // 6. MISSING — live synced products the feed no longer carries. `claimed`
  //    already holds every locally-matched row, so anything left over is gone
  //    upstream. MANUAL products were never loaded, so they can't appear here.
  for (const existing of existingProducts) {
    if (claimed.has(existing.id)) continue;
    if (!existing.isPublic) continue; // already hidden; nothing to propose
    proposals.push({
      productId: existing.id,
      shopProductId: existing.shopProductId ?? "",
      changeType: $Enums.SyncChangeType.MISSING,
      matchedBy: null,
      payload: {
        name: existing.name,
        description: existing.description,
        priceInCents: existing.priceInCents,
        currency: existing.currency,
        imageUrl: existing.imageUrl,
        productUrl: existing.productUrl,
      },
      diff: [],
    });
  }

  const counts = {
    created: proposals.filter(
      (p) => p.changeType === $Enums.SyncChangeType.CREATE,
    ).length,
    updated: proposals.filter(
      (p) => p.changeType === $Enums.SyncChangeType.UPDATE,
    ).length,
    missing: proposals.filter(
      (p) => p.changeType === $Enums.SyncChangeType.MISSING,
    ).length,
  };

  if (proposals.length > 0) {
    await db.productSyncProposal.createMany({
      data: proposals.map((p) => ({
        runId: run.id,
        productId: p.productId,
        shopProductId: p.shopProductId,
        changeType: p.changeType,
        matchedBy: p.matchedBy,
        payload: p.payload,
        diff: p.diff,
      })),
    });
  }

  const status =
    proposals.length > 0
      ? $Enums.SyncRunStatus.PENDING_REVIEW
      : $Enums.SyncRunStatus.EMPTY;

  await db.productSyncRun.update({
    where: { id: run.id },
    data: {
      status,
      fetchedCount: incoming.length,
      finishedAt: new Date(),
      insecureTLSCode: feed.insecureTLSCode,
      // An EMPTY run means the catalog is already in step; record that.
      ...(status === $Enums.SyncRunStatus.EMPTY
        ? { reviewedAt: new Date() }
        : {}),
    },
  });

  if (status === $Enums.SyncRunStatus.EMPTY) {
    await db.shop.update({
      where: { id: shopId },
      data: { lastSyncedAt: new Date() },
    });
  }

  console.log(
    `[product-sync] Shop ${shopId} (${platform}): ${incoming.length} fetched, ${counts.created} new, ${counts.updated} updated, ${counts.missing} missing.`,
  );

  return { runId: run.id, status, fetchedCount: incoming.length, ...counts };
}

// --- Applying ---------------------------------------------------------------

export type ApplyResult = {
  created: number;
  updated: number;
  hidden: number;
  rejected: number;
};

/**
 * Commit the approved proposals of a run. Everything else in the run is marked
 * REJECTED, so a run is fully resolved in one pass and can't be half-applied.
 */
export async function applySyncRun(
  db: PrismaClient,
  runId: string,
  approvedProposalIds: string[],
  reviewedById: string,
): Promise<ApplyResult> {
  const run = await db.productSyncRun.findUnique({
    where: { id: runId },
    include: { proposals: true },
  });
  if (!run) throw new Error(`Sync run ${runId} not found.`);
  if (run.status !== $Enums.SyncRunStatus.PENDING_REVIEW) {
    throw new Error(
      `Sync run ${runId} is ${run.status}, not awaiting review.`,
    );
  }

  const approved = new Set(approvedProposalIds);
  const result: ApplyResult = { created: 0, updated: 0, hidden: 0, rejected: 0 };

  // Products an admin hid by hand must not be un-hidden by an approved update.
  // Loaded up front so the transaction below stays a straight run of writes.
  const targetIds = run.proposals
    .filter((p) => approved.has(p.id) && p.productId)
    .map((p) => p.productId!);
  const manuallyHidden = new Set(
    (
      await db.product.findMany({
        where: { id: { in: targetIds }, manualFields: { has: "isPublic" } },
        select: { id: true },
      })
    ).map((p) => p.id),
  );

  await db.$transaction(async (tx) => {
    for (const proposal of run.proposals) {
      if (!approved.has(proposal.id)) {
        result.rejected++;
        continue;
      }

      const payload = proposal.payload as unknown as SyncedPayload;
      const diff = proposal.diff as unknown as DiffEntry[];

      if (proposal.changeType === $Enums.SyncChangeType.CREATE) {
        await tx.product.create({
          data: {
            shopId: run.shopId,
            shopProductId: proposal.shopProductId,
            scrapeMethod: run.platform,
            name: payload.name,
            description: payload.description || "No description available",
            priceInCents: payload.priceInCents,
            // The catalog only offers USD; keep imports consistent with the
            // coercion in `productSchema`.
            currency: payload.currency ? "USD" : null,
            imageUrl: payload.imageUrl,
            productUrl: payload.productUrl,
            // Curated data starts empty and is filled in by hand.
            tags: [],
            attributeTags: [],
            materialTags: [],
            environmentalTags: [],
            aiGeneratedTags: [],
            manualFields: [],
          },
        });
        result.created++;
        continue;
      }

      if (proposal.changeType === $Enums.SyncChangeType.MISSING) {
        if (proposal.productId) {
          await tx.product.update({
            where: { id: proposal.productId },
            data: { isPublic: false },
          });
          result.hidden++;
        }
        continue;
      }

      // UPDATE — apply only the fields no human has claimed, and backfill the
      // external id so next week matches on the fast path.
      if (!proposal.productId) continue;
      const data: Record<string, unknown> = {
        shopProductId: proposal.shopProductId,
        ...(manuallyHidden.has(proposal.productId) ? {} : { isPublic: true }),
      };
      for (const entry of applicableDiff(diff)) {
        data[entry.field] = entry.after;
      }
      await tx.product.update({
        where: { id: proposal.productId },
        data,
      });
      result.updated++;
    }

    await tx.productSyncProposal.updateMany({
      where: { runId, id: { in: [...approved] } },
      data: { status: $Enums.ProposalStatus.APPROVED },
    });
    await tx.productSyncProposal.updateMany({
      where: { runId, id: { notIn: [...approved] } },
      data: { status: $Enums.ProposalStatus.REJECTED },
    });
    await tx.productSyncRun.update({
      where: { id: runId },
      data: {
        status: $Enums.SyncRunStatus.APPLIED,
        reviewedAt: new Date(),
        reviewedById,
      },
    });
    await tx.shop.update({
      where: { id: run.shopId },
      data: { lastSyncedAt: new Date() },
    });
  });

  console.log(
    `[product-sync] Applied run ${runId}: ${result.created} created, ${result.updated} updated, ${result.hidden} hidden, ${result.rejected} rejected.`,
  );
  return result;
}

// --- Sitewide sweep ---------------------------------------------------------

export type ShopRunOutcome = {
  shopId: string;
  shopName: string;
  status: string;
  created?: number;
  updated?: number;
  missing?: number;
  runId?: string;
  message?: string;
};

export type SyncSweepSummary = {
  shopsConsidered: number;
  shopsPlanned: number;
  shopsSkipped: number;
  shopsFailed: number;
  results: ShopRunOutcome[];
};

/**
 * Visit every shop configured for automatic syncing and plan a run for each.
 *
 * Shared by the weekly cron (`POST /api/cron/sync-products`) and the admin
 * "Sync all shops now" button, so the scheduled and on-demand sweeps can never
 * drift apart.
 *
 * Deliberately **sequential**: these are small artisan storefronts, several of
 * them on shared hosting, and a parallel fan-out is how you get rate-limited or
 * blamed for load. Each shop is isolated in its own try/catch so one broken
 * store can't abort the whole sweep for everyone else.
 *
 * @param opts.shopIds  Restrict the sweep to these shops (used to scope an
 *                      on-demand sweep); omit to visit every configured shop.
 * @param opts.triggeredManually  Marks the resulting runs as hand-started.
 * @param opts.fetchFeed  Test seam; see `planShopSync`.
 */
export async function runScheduledSync(
  db: PrismaClient,
  opts: {
    shopIds?: string[];
    triggeredManually?: boolean;
    fetchFeed?: typeof fetchStoreFeed;
  } = {},
): Promise<SyncSweepSummary> {
  const shops = await db.shop.findMany({
    where: {
      syncEnabled: true,
      syncPlatform: { not: null },
      ...(opts.shopIds?.length ? { id: { in: opts.shopIds } } : {}),
    },
    select: { id: true, name: true, syncPlatform: true },
    orderBy: { name: "asc" },
  });

  const summary: SyncSweepSummary = {
    shopsConsidered: shops.length,
    shopsPlanned: 0,
    shopsSkipped: 0,
    shopsFailed: 0,
    results: [],
  };

  for (const shop of shops) {
    // Square and manual platforms have no public feed; skip without noise.
    if (!toFetchablePlatform(shop.syncPlatform)) {
      summary.shopsSkipped++;
      summary.results.push({
        shopId: shop.id,
        shopName: shop.name,
        status: "skipped",
        message: `${shop.syncPlatform} has no automatic feed.`,
      });
      continue;
    }

    try {
      const result = await planShopSync(db, shop.id, {
        triggeredManually: opts.triggeredManually ?? false,
        fetchFeed: opts.fetchFeed,
      });
      if (result.status === $Enums.SyncRunStatus.FAILED) {
        summary.shopsFailed++;
      } else {
        summary.shopsPlanned++;
      }
      summary.results.push({
        shopId: shop.id,
        shopName: shop.name,
        status: result.status,
        runId: result.runId,
        created: result.created,
        updated: result.updated,
        missing: result.missing,
        message: result.errorMessage,
      });
    } catch (err) {
      // A shop already awaiting review, or one whose config changed mid-sweep,
      // is an expected skip rather than a failure.
      if (
        err instanceof SyncAlreadyPendingError ||
        err instanceof SyncNotConfiguredError
      ) {
        summary.shopsSkipped++;
        summary.results.push({
          shopId: shop.id,
          shopName: shop.name,
          status: "skipped",
          message: err.message,
        });
        continue;
      }

      summary.shopsFailed++;
      console.error(
        `[product-sync] Unexpected failure for shop ${shop.id}:`,
        err,
      );
      summary.results.push({
        shopId: shop.id,
        shopName: shop.name,
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return summary;
}
