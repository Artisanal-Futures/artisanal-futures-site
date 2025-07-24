import { PrismaClient } from '@prisma/client'
import { categoriesWithKeywords } from './category-data'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching all products and product categories...')
  const allProducts = await prisma.product.findMany();
  const allCategories = await prisma.category.findMany();
  const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c.id]));

  console.log(`Processing ${allProducts.length} products...`);

  for (const product of allProducts) {
    const categoriesToConnect = new Set<string>();
    const textToSearch = `${product.name.toLowerCase()} ${product.tags.join(' ').toLowerCase()} ${product.description.toLowerCase()}`;
    
    for (const category of categoriesWithKeywords) {
      if (category.keywords && category.keywords.some(keyword => textToSearch.includes(keyword.toLowerCase()))) {
        const categoryId = categoryMap.get(category.name.toLowerCase());
        if (categoryId) {
          categoriesToConnect.add(categoryId);
        }
      }
      for (const subCategory of category.children) {
        if (subCategory.keywords.some(keyword => textToSearch.includes(keyword.toLowerCase()))) {
          const categoryId = categoryMap.get(subCategory.name.toLowerCase());
          if (categoryId) {
            categoriesToConnect.add(categoryId);
          }
        }
      }
    }

    if (categoriesToConnect.size > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          categories: { set: Array.from(categoriesToConnect).map(id => ({ id })) },
        },
      });
      console.log(`Connected "${product.name}"`);
    } else {
      console.log(`  - No category match for "${product.name}"`);
    }
  }

  console.log(`\nFinished connecting products!`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })