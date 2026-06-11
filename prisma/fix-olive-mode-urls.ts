import { PrismaClient } from "generated/prisma";

const prisma = new PrismaClient();

const SHOP_NAME = "Olive Mode";
const DOMAIN = "https://olivemodeboutique.com";

async function main() {
  const shops = await prisma.shop.findMany({
    where: { name: SHOP_NAME },
    select: { id: true, name: true },
  });

  if (shops.length !== 1) {
    console.error(
      `Expected exactly 1 "${SHOP_NAME}" shop, found ${shops.length}:`,
      shops,
    );
    process.exitCode = 1;
    return;
  }

  const shop = shops[0]!;
  console.log(`Resolved "${SHOP_NAME}" -> shop id ${shop.id}`);

  // Idempotent: only prepend the domain to relative URLs (those starting with
  // "/"). URLs that are already absolute (http...) are left untouched, so this
  // is safe to run more than once.
  const count = await prisma.$executeRaw`
    UPDATE "Product"
    SET "productUrl" = ${DOMAIN} || "productUrl"
    WHERE "shopId" = ${shop.id}
      AND "productUrl" LIKE '/%'
  `;

  console.log(`Updated ${count} product URL(s).`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
