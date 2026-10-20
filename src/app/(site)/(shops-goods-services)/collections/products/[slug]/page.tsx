import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { shopPath } from "~/lib/seo/paths";
import { breadcrumbSchema, collectionPageSchema } from "~/lib/seo/schema";
import { buildMetadata } from "~/lib/seo/site";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/server";
import { buttonVariants } from "~/components/ui/button";
import { JsonLd } from "~/components/seo/json-ld";

import { CategoryClient } from "../_components/product-category-client";
import { ProductSearch } from "../../../_components/product-search";

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
    return notFound();
  }

  const {
    products,
    totalCount,
    totalPages,
    subcategories,
    isFuzzy,
    suggestions,
  } = await api.product.getAllByCategory({
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

  // Products have no detail pages of their own, so each item links to its
  // shop's profile. Only the unfiltered first page is described, matching the
  // canonical URL.
  const isPlainListing =
    page === 1 && !search && !storeId && !attributes && !subcategoryName;
  const listingName =
    categoryName === "all-products"
      ? "All Products"
      : (category?.name ?? "Products");
  const categoryPath = `/collections/products/${encodeURIComponent(categoryName.toLowerCase())}`;
  const items = products.flatMap((product) =>
    product.shop ? [{ name: product.name, path: shopPath(product.shop) }] : [],
  );

  return (
    <>
      {isPlainListing && (
        <JsonLd
          data={[
            collectionPageSchema({
              name: listingName,
              path: categoryPath,
              items,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Products", path: "/collections/products" },
              { name: listingName, path: categoryPath },
            ]),
          ]}
        />
      )}
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

export const generateMetadata = async ({
  params,
  searchParams,
}: Props): Promise<Metadata> => {
  const serverParams = await params;
  const serverSearchParams = await searchParams;
  const categoryName = decodeURIComponent(serverParams.slug);
  const category = await api.category.getBySlug({ slug: categoryName });

  if (!category) {
    return {
      title: "Product Category",
      robots: { index: false, follow: false },
    };
  }

  // Canonical drops filter/sort/search params so every variant of a category
  // consolidates onto one URL; only pagination is kept. Lowercased to match the
  // category links and the sitemap.
  const page = toPositiveInt(serverSearchParams.page, 1);
  const basePath = `/collections/products/${encodeURIComponent(categoryName.toLowerCase())}`;
  const path = page > 1 ? `${basePath}?page=${page}` : basePath;

  const isAll = categoryName === "all-products";
  const name = isAll ? "All Products" : category.name;

  return buildMetadata({
    title: name,
    description: isAll
      ? "Browse all of our artisans' products."
      : `Browse our artisans' products in the ${category.name} category.`,
    path,
  });
};
