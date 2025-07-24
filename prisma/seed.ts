import { PrismaClient } from '@prisma/client'
import { categoriesWithKeywords } from './category-data'

const prisma = new PrismaClient()

async function main() {
  console.log(`Clearing existing categories...`);

  const allProducts = await prisma.product.findMany({
    select: { id: true }
  });

  console.log(`- Disconnecting categories from ${allProducts.length} products...`);
  for (const product of allProducts) {
    await prisma.product.update({
      where: { id: product.id },
      data: {
        categories: {
          set: [],
        },
      },
    });
  }
  console.log(`- All products disconnected.`);

  await prisma.category.deleteMany();
  console.log(`- All old categories deleted.`);
  
  console.log(`\nStart seeding new categories...`)
  for (const cat of categoriesWithKeywords) {
    const parent = await prisma.category.create({
      data: { 
        name: cat.name,
        type: cat.type,
        },
    })
    console.log(`Created category: ${parent.name}`)

    for (const subCat of cat.children) {
      await prisma.category.create({
        data: {
          name: subCat.name,
          parentId: parent.id,
          type: cat.type,
        },
      })
      console.log(`  - Created subcategory: ${subCat.name}`)
    }
  }
  console.log(`\nSeeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })