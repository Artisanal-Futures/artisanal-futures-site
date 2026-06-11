import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { api } from "~/trpc/server";
import { buttonVariants } from "~/components/ui/button";

import { CategoryClient } from "../_components/product-category-client";

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
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Artisan Products</p>
            <h1>{category?.name}</h1>
          </div>
          <p className="description">
            <Link
              href="/collections/products"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "w-auto",
                }),
              )}
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back to product categories
            </Link>
          </p>
        </div>
      </header>

      <section className="site-section">
        <CategoryClient
          initialProducts={products}
          subcategories={subcategories}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </section>
    </>
  );
}

export const generateMetadata = async ({ params }: Props) => {
  const serverParams = await params;
  const categoryName = decodeURIComponent(serverParams.slug);
  const category = await api.category.getBySlug({ slug: categoryName });

  return {
    title: category?.name ?? "Product Category",
    description: `Browse all our artisans' products in the ${category?.name} category`,
  };
};
