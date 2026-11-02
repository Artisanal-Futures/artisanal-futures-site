/**
 * Suggest a sector for every shop without one, from its public products' and
 * services' top-level categories (see prisma/category-data.ts).
 *
 * Usage:
 *
 *   pnpm backfill-shop-sectors           # dry run: print suggestions only
 *   pnpm backfill-shop-sectors --apply   # write them
 *
 * Safe to re-run: shops that already have a sector are left alone, and shops
 * with nothing to go on are skipped (they show as "Other"). Each listing
 * votes for its categories' sectors; attribute tags break ties and decide for
 * shops without categorized listings.
 */

import type { ShopSectorId } from "../src/lib/constants/shop-sectors";

import { PrismaClient } from "../generated/prisma";
import { SHOP_SECTOR_IDS } from "../src/lib/constants/shop-sectors";

/** Top-level category name → sector. Gift Cards say nothing, so skip them. */
const CATEGORY_SECTORS: Record<string, ShopSectorId> = {
  Clothing: "apparel",
  Jewelry: "jewelry",
  "Bags & Accessories": "jewelry",
  "Bath & Beauty": "beauty-wellness",
  "Home & Kitchen": "home-goods",
  "Craft Supplies": "home-goods",
  "Custom & Made-to-Order": "home-goods",
  "Creative & Design": "art-design",
  "Workshops & Classes": "education",
  "Consulting & Expertise": "services",
  "Nature & Wellness": "beauty-wellness",
};

/** Subcategories that belong somewhere other than their parent's sector. */
const SUBCATEGORY_SECTORS: Record<string, ShopSectorId> = {
  Tailoring: "apparel",
  "Gardening & Cultivation": "food-farming",
};

/** Attribute tag → sector, for tie-breaks and shops with no categories. */
const ATTRIBUTE_SECTORS: Record<string, ShopSectorId> = {
  "Food Sovereignty": "food-farming",
  "Community Education": "education",
};

type CategoryRef = { name: string; parent: { name: string } | null };

function sectorForCategory(category: CategoryRef): ShopSectorId | null {
  return (
    SUBCATEGORY_SECTORS[category.name] ??
    CATEGORY_SECTORS[category.parent?.name ?? category.name] ??
    null
  );
}

/** One vote per listing per sector, so a many-category listing isn't louder. */
function tally(listings: { categories: CategoryRef[] }[]) {
  const votes = new Map<ShopSectorId, number>();
  for (const listing of listings) {
    const sectors = new Set(
      listing.categories
        .map(sectorForCategory)
        .filter((s): s is ShopSectorId => s !== null),
    );
    for (const sector of sectors) {
      votes.set(sector, (votes.get(sector) ?? 0) + 1);
    }
  }
  return votes;
}

function pickSector(
  votes: Map<ShopSectorId, number>,
  attributeTags: string[],
): ShopSectorId | null {
  const hinted = new Set(
    attributeTags
      .map((tag) => ATTRIBUTE_SECTORS[tag])
      .filter((s): s is ShopSectorId => s !== undefined),
  );

  const top = Math.max(0, ...votes.values());
  if (top === 0) {
    // No categorized listings: an attribute hint, if exactly one.
    return hinted.size === 1 ? [...hinted][0]! : null;
  }

  const leaders = SHOP_SECTOR_IDS.filter((id) => votes.get(id) === top);
  if (leaders.length === 1) return leaders[0]!;
  // Tie: prefer a leader the attributes point at, else the first in order.
  return leaders.find((id) => hinted.has(id)) ?? leaders[0]!;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const db = new PrismaClient();

  const categories = {
    select: { name: true, parent: { select: { name: true } } },
  } as const;

  try {
    const shops = await db.shop.findMany({
      where: { sector: null },
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
      const votes = tally([...shop.products, ...shop.services]);
      const sector = pickSector(votes, shop.attributeTags);
      const detail = [...votes].map(([id, n]) => `${id}:${n}`).join(", ");

      if (!sector) {
        console.log(`  ${shop.name}: no suggestion (stays "Other")`);
        continue;
      }
      console.log(`  ${shop.name} -> ${sector}${detail ? ` (${detail})` : ""}`);

      if (apply) {
        await db.shop.update({ where: { id: shop.id }, data: { sector } });
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
