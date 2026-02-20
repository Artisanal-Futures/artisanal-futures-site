import { Suspense } from "react";
import { CategoryType } from "generated/prisma";

import { api } from "~/trpc/server";
import SiteLayout from "~/app/(site)/layout";

import { ServiceCategoriesClient } from "./_components/service-categories-client";
import { ServiceSearch } from "./_components/service-search";

export default async function ServiceCategoriesPage() {
  const categories = await api.category.getCategoriesWithFeaturedProducts({
    type: CategoryType.SERVICE,
  });

  return (
    <div className="site-container">
      <div className="site-header">
        <h1>All Service Categories</h1>
        <p>
          Explore our services by browsing through all available categories and
          subcategories.
        </p>
        <Suspense fallback={null}>
          <ServiceSearch />
        </Suspense>
      </div>

      <ServiceCategoriesClient categories={categories} />
    </div>
  );
}

export const metadata = {
  title: "Service Categories",
  description: "Browse all our artisans' services by category",
};
