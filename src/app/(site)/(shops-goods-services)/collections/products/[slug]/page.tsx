import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { api } from "~/trpc/server";
import { buttonVariants } from "~/components/ui/button";

import { ProductSearch } from "../../../_components/product-search";
import { CategoryClient } from "../_components/product-category-client";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * `Number("abc")` is NaN and `Number("")` is 0, either of which used to reach
 * the router as a page or limit. Fall back to the default instead.
 */
function toPositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const serverParams = await params;
  const serverSearchParams = await searchParams;

  const page = toPositiveInt(serverSearchParams.page, 1);
  const limit = Math.min(toPositiveInt(serverSearchParams.limit, 20), 100);
  const rawSort = serverSearchParams.sort;
  // Leave `sort` undefined when it isn't an explicit choice so the router can
  // apply its own default (relevance while searching, A–Z otherwise).
  const sort =
    rawSort === "asc" || rawSort === "desc" || rawSort === "relevance"
      ? rawSort
      : undefined;
  const storeId = serverSearchParams.store as string | undefined;
  const search = serverSearchParams.search as string | undefined;
  const attributes = serverSearchParams.attributes
    ? (serverSearchParams.attributes as string).split(",").filter(Boolean)
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

  const { products, totalCount, totalPages, subcategories, isFuzzy, suggestions } =
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

  // `category.getBySlug` returns the literal name "All" for the all-products
  // sentinel, which read as a bare "All" heading on the search results page.
  const heading = search
    ? `Results for “${search}”`
    : categoryName === "all-products"
      ? "All Products"
      : (category?.name ?? "Products");

  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Artisan Products</p>
            <h1>{heading}</h1>
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
        {/* Keep the search box available on the results page itself — it used
            to disappear the moment results appeared. */}
        <Suspense fallback={null}>
          <ProductSearch
            type="products"
            basePath={`/collections/products/${serverParams.slug}`}
          />
        </Suspense>

        <CategoryClient
          initialProducts={products}
          subcategories={subcategories}
          totalCount={totalCount}
          totalPages={totalPages}
          isFuzzy={isFuzzy}
          suggestions={suggestions}
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
