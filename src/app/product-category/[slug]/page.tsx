import { api } from "~/trpc/server";

import { CategoryClient } from "./_components/product-category-client";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoryPage({ params, searchParams }: Props) {
  const serverParams = await params;
  const serverSearchParams = await searchParams;

  const page = Number(serverSearchParams.page ?? 1);
  const limit = Number(serverSearchParams.limit ?? 20);
  const sort = (serverSearchParams.sort as "asc" | "desc") ?? "asc";
  const storeId = serverSearchParams.store as string | undefined;
  const search = serverSearchParams.search as string | undefined;
  const attributes = serverSearchParams.attributes
    ? (serverSearchParams.attributes as string).split(",")
    : undefined;

  // Decode URL params to get the real names
  const categoryName = decodeURIComponent(serverParams.slug);
  const subcategoryName = serverSearchParams.subcategory
    ? decodeURIComponent(serverSearchParams.subcategory as string)
    : undefined;

  const category = await api.category.getBySlug({ slug: categoryName });

  if (!category && categoryName !== "all-products") {
    return <div>Category not found.</div>;
  }

  const { products, totalCount, totalPages, subcategories } =
    await api.product.getAllByCategory({
      categoryName: categoryName,
      subcategoryName: subcategoryName,
      page,
      limit,
      sort,
      storeId,
      search,
      attributes,
    });

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight">{category?.name}</h1>
      </div>
      <CategoryClient
        initialProducts={products}
        subcategories={subcategories}
        totalCount={totalCount}
        totalPages={totalPages}
      />
    </div>
  );
}
