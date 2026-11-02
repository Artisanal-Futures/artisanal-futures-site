/**
 * Create the starting shop sectors and move shops onto them from the
 * deprecated `Shop.sector` column.
 *
 * Usage:
 *
 *   pnpm seed-shop-sectors           # dry run: print what would change
 *   pnpm seed-shop-sectors --apply   # write it
 *
 * A sector is only created if nothing has its slug or name, so re-running
 * never overwrites admin edits, but it does bring back a seed sector an admin
 * deleted. Only shops with `sectorId = null` are touched, which includes any
 * shop an admin cleared back to "No sector" if its old column still maps to a
 * sector, so don't re-run this once admins are editing shop sectors.
 */

import type { SectorColorKey } from "../src/lib/constants/shop-sectors";

import { PrismaClient } from "../generated/prisma";

const SEED_SECTORS: {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  colorKey: SectorColorKey;
}[] = [
  {
    slug: "food-land",
    name: "Food & Land",
    shortName: "Food",
    description:
      "Growing, making or sharing food, and caring for the land it comes from.",
    colorKey: "green",
  },
  {
    slug: "clothing-adornment",
    name: "Clothing & Adornment",
    shortName: "Clothing",
    description: "Apparel, textiles, jewelry and accessories made to be worn.",
    colorKey: "plum",
  },
  {
    slug: "home-building",
    name: "Home & Building",
    shortName: "Home",
    description:
      "Handmade goods for the home, along with furniture, repair and construction.",
    colorKey: "terracotta",
  },
  {
    slug: "art-culture",
    name: "Art & Culture",
    shortName: "Art",
    description: "Visual art, design, music and other cultural work.",
    colorKey: "blue",
  },
  {
    slug: "health-care",
    name: "Health & Care",
    shortName: "Health",
    description: "Beauty, wellness and care for bodies and minds.",
    colorKey: "rose",
  },
  {
    slug: "community-learning",
    name: "Community & Learning",
    shortName: "Community",
    description:
      "Workshops, classes and spaces that bring people together to learn.",
    colorKey: "teal",
  },
];

/** Old `Shop.sector` slug → sector slug. Others ("services", "other") stay null. */
const LEGACY_SECTORS: Record<string, string> = {
  apparel: "clothing-adornment",
  jewelry: "clothing-adornment",
  "beauty-wellness": "health-care",
  "home-goods": "home-building",
  "art-design": "art-culture",
  "food-farming": "food-land",
  education: "community-learning",
};

async function main() {
  const apply = process.argv.includes("--apply");
  const db = new PrismaClient();

  try {
    console.log(apply ? "Applying." : "Dry run: pass --apply to save.");

    const existing = await db.shopSector.findMany({
      select: { id: true, slug: true, name: true, sortOrder: true },
    });
    const idBySlug = new Map(existing.map((s) => [s.slug, s.id]));
    let sortOrder = Math.max(-1, ...existing.map((s) => s.sortOrder)) + 1;

    console.log("\nSectors:");
    for (const sector of SEED_SECTORS) {
      if (idBySlug.has(sector.slug)) {
        console.log(`  ${sector.slug}: exists, left as is`);
        continue;
      }
      // `name` is unique too: an admin may have renamed another sector to this.
      const sameName = existing.find((s) => s.name === sector.name);
      if (sameName) {
        console.log(
          `  ${sector.slug}: skipped, "${sector.name}" is already the name of ${sameName.slug}`,
        );
        continue;
      }
      console.log(`  ${sector.slug}: create "${sector.name}"`);
      if (apply) {
        const created = await db.shopSector.create({
          data: { ...sector, sortOrder },
        });
        idBySlug.set(created.slug, created.id);
      }
      sortOrder += 1;
    }

    const shops = await db.shop.findMany({
      where: { sectorId: null },
      select: { id: true, name: true, sector: true },
      orderBy: { name: "asc" },
    });

    console.log(`\n${shops.length} shop(s) without a sector:`);
    let updated = 0;
    for (const shop of shops) {
      const slug = shop.sector ? LEGACY_SECTORS[shop.sector] : undefined;
      if (!slug) {
        console.log(
          `  ${shop.name}: stays "Other" (was ${shop.sector ?? "unset"})`,
        );
        continue;
      }
      console.log(`  ${shop.name}: ${shop.sector} -> ${slug}`);

      if (apply) {
        const sectorId = idBySlug.get(slug);
        if (!sectorId) {
          console.log(`    skipped: sector ${slug} doesn't exist`);
          continue;
        }
        await db.shop.update({ where: { id: shop.id }, data: { sectorId } });
        updated += 1;
      }
    }

    if (apply) console.log(`\nUpdated ${updated} shop(s).`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
