import { api } from "~/trpc/server";
import { CategoryClient } from "./_components/category-client";

type CategoryPageProps = {
  params: {
    slug: string;
  };
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const slug = decodeURIComponent(params.slug);
  const category = await api.category.getBySlug({ slug });

  console.log("--- DEBUGGING CATEGORY PAGE ---");
  console.log("FETCHED CATEGORY:", category?.name);
  console.log("SUBCATEGORIES FOUND:", category?.children.map(c => c.name));

  if (!category) {
    return <div>Category not found.</div>;
  }

  const idsToFetch = [category.id, ...category.children.map(child => child.id)];
  console.log("IDs BEING SENT TO API:", idsToFetch);

  const products = await api.product.getAllByCategory({ categoryIds: idsToFetch });


  console.log("PRODUCTS RETURNED FROM API:", products.length);
  console.log("---------------------------------");

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold tracking-tight">{category.name}</h1>
      <CategoryClient 
        initialProducts={products} 
        subcategories={category.children} 
      />
    </div>
  );
}