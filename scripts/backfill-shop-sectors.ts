/**
 * Suggest a sector for every shop without one, from its public products' and
 * services' top-level categories (see prisma/category-data.ts). Run
 * `pnpm seed-shop-sectors --apply` first: sectors are looked up in the database.
 *
 * Usage:
 *
 *   pnpm backfill-shop-sectors           # dry run: print suggestions only
 *   pnpm backfill-shop-sectors --apply   # write them
 *
 * Safe to re-run: shops that already have a sector are left alone, and shops
 * with nothing to go on are skipped (they show as "Other"). Each listing
 * votes for its categories' sectors; attribute tags break ties and decide for
 * shops without categorized listings. Sectors an admin has since deleted get
 * no votes.
 */

import { PrismaClient } from "../generated/prisma";

/**
 * Top-level category name → sector slug. Gift Cards say nothing, and neither
 * does Consulting & Expertise, since no sector covers general services.
 */
const CATEGORY_SECTORS: Record<string, string> = {
  Clothing: "clothing-adornment",
  Jewelry: "clothing-adornment",
  "Bags & Accessories": "clothing-adornment",
  "Bath & Beauty": "health-care",
  "Home & Kitchen": "home-building",
  "Craft Supplies": "home-building",
  "Custom & Made-to-Order": "home-building",
  "Creative & Design": "art-culture",
  "Workshops & Classes": "community-learning",
  "Nature & Wellness": "health-care",
};

/** Subcategories that belong somewhere other than their parent's sector. */
const SUBCATEGORY_SECTORS: Record<string, string> = {
  Tailoring: "clothing-adornment",
  "Gardening & Cultivation": "food-land",
};

/** Attribute tag → sector slug, for tie-breaks and shops with no categories. */
const ATTRIBUTE_SECTORS: Record<string, string> = {
  "Food Sovereignty": "food-land",
  "Community Education": "community-learning",
};

type CategoryRef = { name: string; parent: { name: string } | null };

function sectorForCategory(category: CategoryRef): string | null {
  return (
    SUBCATEGORY_SECTORS[category.name] ??
    CATEGORY_SECTORS[category.parent?.name ?? category.name] ??
    null
  );
}

/** One vote per listing per sector, so a many-category listing isn't louder. */
function tally(
  listings: { categories: CategoryRef[] }[],
  known: Map<string, string>,
) {
  const votes = new Map<string, number>();
  for (const listing of listings) {
    const sectors = new Set(
      listing.categories
        .map(sectorForCategory)
        .filter((s): s is string => s !== null && known.has(s)),
    );
    for (const sector of sectors) {
      votes.set(sector, (votes.get(sector) ?? 0) + 1);
    }
  }
  return votes;
}

/** `known` maps slug → id, in display order, which settles remaining ties. */
function pickSector(
  votes: Map<string, number>,
  attributeTags: string[],
  known: Map<string, string>,
): string | null {
  const hinted = new Set(
    attributeTags
      .map((tag) => ATTRIBUTE_SECTORS[tag])
      .filter((s): s is string => s !== undefined && known.has(s)),
  );

  const top = Math.max(0, ...votes.values());
  if (top === 0) {
    // No categorized listings: an attribute hint, if exactly one.
    return hinted.size === 1 ? [...hinted][0]! : null;
  }

  const leaders = [...known.keys()].filter((slug) => votes.get(slug) === top);
  if (leaders.length === 1) return leaders[0]!;
  // Tie: prefer a leader the attributes point at, else the first in order.
  return leaders.find((slug) => hinted.has(slug)) ?? leaders[0]!;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const db = new PrismaClient();

  const categories = {
    select: { name: true, parent: { select: { name: true } } },
  } as const;

  try {
    const sectors = await db.shopSector.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, slug: true },
    });
    if (sectors.length === 0) {
      console.log("No sectors yet. Run pnpm seed-shop-sectors --apply first.");
      return;
    }
    const known = new Map(sectors.map((s) => [s.slug, s.id]));

    const shops = await db.shop.findMany({
      where: { sectorId: null },
      select: {
        id: true,
        name: true,
        attributeTags: true,
        products: { where: { isPublic: true }, select: { categories } },
        services: { where: { isPublic: true }, select: { categories } },
      },
      orderBy: { name: "asc" },
    });

    console.log(
      `${shops.length} shop(s) without a sector.${apply ? "" : " Dry run: pass --apply to save."}`,
    );

    let updated = 0;
    for (const shop of shops) {
      const votes = tally([...shop.products, ...shop.services], known);
      const sector = pickSector(votes, shop.attributeTags, known);
      const detail = [...votes].map(([slug, n]) => `${slug}:${n}`).join(", ");

      if (!sector) {
        console.log(`  ${shop.name}: no suggestion (stays "Other")`);
        continue;
      }
      console.log(`  ${shop.name} -> ${sector}${detail ? ` (${detail})` : ""}`);

      if (apply) {
        await db.shop.update({
          where: { id: shop.id },
          data: { sectorId: known.get(sector) },
        });
        updated += 1;
      }
    }

    if (apply) console.log(`Updated ${updated} shop(s).`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
