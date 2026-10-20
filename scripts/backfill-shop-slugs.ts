/**
 * Give every shop without a slug one derived from its name.
 *
 * Usage:
 *
 *   pnpm backfill-shop-slugs
 *
 * Safe to re-run: shops that already have a slug are left alone. Collisions
 * get a numeric suffix ("kente-collective-2"), oldest shop first, so the
 * original shop keeps the clean slug.
 */

import { PrismaClient } from "../generated/prisma";
import { generateUniqueShopSlug } from "../src/server/seo/shop-slug";

async function main() {
  const db = new PrismaClient();

  try {
    const shops = await db.shop.findMany({
      where: { slug: null },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    console.log(`${shops.length} shop(s) need a slug.`);

    for (const shop of shops) {
      const slug = await generateUniqueShopSlug(db, shop.name, shop.id);
      await db.shop.update({ where: { id: shop.id }, data: { slug } });
      console.log(`  ${shop.name} -> /shops/${slug}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
