import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { shopPath } from "~/lib/seo/paths";
import { breadcrumbSchema, collectionPageSchema } from "~/lib/seo/schema";
import { buildMetadata } from "~/lib/seo/site";
import { api } from "~/trpc/server";
import { JsonLd } from "~/components/seo/json-ld";

import { ServiceCategoryClient } from "../_components/service-category-client";
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

export default async function ServiceCategoryPage({
  params,
  searchParams,
}: Props) {
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

  const categoryName = decodeURIComponent(serverParams.slug);
  const subcategoryName = serverSearchParams.subcategory
    ? decodeURIComponent(serverSearchParams.subcategory as string)
    : undefined;

  const category = await api.category.getBySlug({ slug: categoryName });

  if (!category && categoryName !== "all-services") {
    return notFound();
  }

  const {
    services: rawServices,
    totalCount,
    totalPages,
    subcategories,
    isFuzzy,
    suggestions,
  } = await api.service.getAllByCategory({
    categoryName: categoryName,
    subcategoryName: subcategoryName,
    page,
    limit,
    sort,
    storeId,
    search,
    attributes,
  });

  const services = rawServices.filter(
    (service): service is NonNullable<typeof service> => service !== null,
  );

  // `category.getBySlug` returns the literal name "All" for the all-services
  // sentinel, which read as a bare "All" heading on the search results page.
  const heading = search
    ? `Results for “${search}”`
    : categoryName === "all-services"
      ? "All Services"
      : (category?.name ?? "Services");

  // Services have no detail pages of their own, so each item links to its
  // shop's profile. Only the unfiltered first page is described, matching the
  // canonical URL.
  const isPlainListing =
    page === 1 && !search && !storeId && !attributes && !subcategoryName;
  const listingName =
    categoryName === "all-services"
      ? "All Services"
      : (category?.name ?? "Services");
  const categoryPath = `/collections/services/${encodeURIComponent(categoryName.toLowerCase())}`;
  const items = services.flatMap((service) =>
    service.shop ? [{ name: service.name, path: shopPath(service.shop) }] : [],
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
              { name: "Services", path: "/collections/services" },
              { name: listingName, path: categoryPath },
            ]),
          ]}
        />
      )}
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Artisan Services</p>
            <h1>{heading}</h1>
          </div>
        </div>
      </header>
      <section className="site-section">
        {/* Keep the search box available on the results page itself — it used
            to disappear the moment results appeared. */}
        <Suspense fallback={null}>
          <ProductSearch
            type="services"
            basePath={`/collections/services/${serverParams.slug}`}
          />
        </Suspense>

        <ServiceCategoryClient
          initialServices={services}
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
      title: "Service Category",
      robots: { index: false, follow: false },
    };
  }

  // Canonical drops filter/sort/search params so every variant of a category
  // consolidates onto one URL; only pagination is kept. Lowercased to match the
  // category links and the sitemap.
  const page = toPositiveInt(serverSearchParams.page, 1);
  const basePath = `/collections/services/${encodeURIComponent(categoryName.toLowerCase())}`;
  const path = page > 1 ? `${basePath}?page=${page}` : basePath;

  const isAll = categoryName === "all-services";
  const name = isAll ? "All Services" : category.name;

  return buildMetadata({
    title: name,
    description: isAll
      ? "Browse all of our artisans' services."
      : `Browse our artisans' services in the ${category.name} category.`,
    path,
  });
};
