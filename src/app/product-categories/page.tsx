import { Suspense } from "react";
import { CategoryType } from "generated/prisma";

import { api } from "~/trpc/server";
import SiteLayout from "~/app/(site)/layout";

import { ProductCategoriesClient } from "./_components/product-categories-client";
import { ProductSearch } from "./_components/product-search";

export default async function ProductCategoriesPage() {
  const categories = await api.category.getCategoriesWithFeaturedProducts({
    type: CategoryType.PRODUCT,
  });

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            All Product Categories
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Explore our products by browsing through all available categories.
          </p>
          <Suspense fallback={null}>
            <ProductSearch />
          </Suspense>
        </div>
        <ProductCategoriesClient categories={categories} />
      </div>
    </SiteLayout>
  );
}

export const metadata = {
  title: "All Product Categories",
  description: "Browse all product categories.",
};
