import { api } from "~/trpc/server";
import { CategoryClient } from "./_components/product-category-client";

type CategoryPageProps = {
  params: {
    slug: string;
  };
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const slug = decodeURIComponent(params.slug);
  const category = await api.category.getBySlug({ slug });

  if (!category) {
    return <div>Category not found.</div>;
  }

  const idsToFetch = [category.id, ...category.children.map(child => child.id)];
  const products = await api.product.getAllByCategory({ categoryIds: idsToFetch });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          {category.name}
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Browse all products in the {category.name} category.
        </p>
      </div>
      
      <div className="rounded-lg bg-background shadow-sm">
        <CategoryClient 
          initialProducts={products} 
          subcategories={category.children} 
        />
      </div>
    </div>
  );
}
