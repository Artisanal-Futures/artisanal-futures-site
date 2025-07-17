import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Disconnecting all products from categories...')
  const products = await prisma.product.findMany({
    select: { id: true }
  });

  for (const product of products) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        categories: {
          set: [], 
        },
      },
    })
  }
  console.log(`Successfully disconnected all products.`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })