import { Suspense } from "react";
import { CategoryType } from "generated/prisma";

import { api } from "~/trpc/server";

import { ProductSearch } from "../../_components/product-search";
import { ServiceCategoriesClient } from "./_components/service-categories-client";

export default async function ServiceCategoriesPage() {
  const categories = await api.category.getCategoriesWithFeaturedProducts({
    type: CategoryType.SERVICE,
  });

  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Artisan Services</p>
            <h1>Service Categories</h1>
          </div>
          <p className="description">
            Explore our makers&apos; services by browsing through different
            categories.
          </p>
        </div>
      </header>

      <section className="site-section">
        <Suspense fallback={null}>
          <ProductSearch type="services" />
        </Suspense>

        <ServiceCategoriesClient categories={categories} />
      </section>
    </>
  );
}

export const metadata = {
  title: "Service Categories",
  description: "Browse all our artisans' services by category",
};
