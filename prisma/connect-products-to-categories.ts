import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const keywordMapping: Record<string, string[]> = {
  'Tops': ['shirt'],
  'Bottoms': ['pants', 'skirts'],
  'Dresses & Skirts': ['dress', 'skirt'],
  'Jackets': ['jacket'],
  'Jewelry': ['necklace', 'pendant', 'earrings', 'bracelet', 'anklet', 'ring', 'beads'],
  'Bags & Wallets': ['bag', 'wallet'],
  'Skincare': ['facial spray', 'face mask', 'hand balm', 'pimple mask', 'hydrogel'],
  'Tools & Brushes': ['gua sha', 'massager', 'roller', 'dry brush', 'makeup clips'],
  'Bath & Body': ['sanitizer', 'shower cap', 'fragrance'],
};


async function main() {
  console.log('Fetching all products and categories...')
  const allProducts = await prisma.product.findMany();
  const allCategories = await prisma.category.findMany();

  const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c.id]));
  let connectionsMade = 0;

  console.log(`Processing ${allProducts.length} products...`);

  for (const product of allProducts) {
    const categoriesToConnect: { id: string }[] = [];
    
    const textToSearch = `${product.name.toLowerCase()} ${product.tags.join(' ').toLowerCase()} ${product.description.toLowerCase()}`;

    for (const [categoryName, keywords] of Object.entries(keywordMapping)) {
      if (keywords.some(keyword => textToSearch.includes(keyword))) {
        const categoryId = categoryMap.get(categoryName.toLowerCase());
        if (categoryId) {
          if (!categoriesToConnect.some(c => c.id === categoryId)) {
            categoriesToConnect.push({ id: categoryId });
          }
        }
      }
    }

    if (categoriesToConnect.length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          categories: {
            connect: categoriesToConnect,
          },
        },
      });
      console.log(`Connected product "${product.name}" to ${categoriesToConnect.length} categories.`);
      connectionsMade++;
    }
  }

  console.log(`\nFinished! Made connections for ${connectionsMade} products.`);
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