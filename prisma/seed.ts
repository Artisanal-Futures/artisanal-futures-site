import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const categoriesData = [
  {
    name: 'Clothing',
    children: [
      { name: 'Tops' },
      { name: 'Bottoms' },
      { name: 'Dresses & Skirts' },
      { name: 'Jackets' },
    ],
  },
  {
    name: 'Jewelry',
    children: [
      { name: 'Necklaces & Pendants' },
      { name: 'Earrings' },
      { name: 'Bracelets & Anklets' },
      { name: 'Rings' },
    ],
  },
  {
    name: 'Bags & Accessories',
    children: [
      { name: 'Bags & Wallets' },
      { name: 'Masks (Sleeping/Eye)' },
      { name: 'Apparel Solutions' },
    ],
  },
  {
    name: 'Bath & Beauty',
    children: [
      { name: 'Skincare' },
      { name: 'Bath & Body' },
      { name: 'Tools & Brushes' },
    ],
  },
  {
    name: 'Home & Kitchen',
    children: [
      { name: 'Decor' },
      { name: 'Bar & Drinkware' },
    ],
  },
  {
    name: 'Gift Cards',
    children: [],
  },
]

async function main() {
  console.log(`Start seeding ...`)
  for (const cat of categoriesData) {
    const parent = await prisma.category.create({
      data: {
        name: cat.name,
      },
    })
    console.log(`Created category with id: ${parent.id}`)

    if (cat.children.length > 0) {
      for (const subCat of cat.children) {
        const child = await prisma.category.create({
          data: {
            name: subCat.name,
            parentId: parent.id, 
          },
        })
        console.log(`  - Created subcategory with id: ${child.id}`)
      }
    }
  }
  console.log(`Seeding finished.`)
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