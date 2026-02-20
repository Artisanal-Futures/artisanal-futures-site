import { Suspense } from "react";
import { CategoryType } from "generated/prisma";

import { api } from "~/trpc/server";

import { ProductCategoriesClient } from "./_components/product-categories-client";
import { ProductSearch } from "./_components/product-search";

export default async function ProductCategoriesPage() {
  const categories = await api.category.getCategoriesWithFeaturedProducts({
    type: CategoryType.PRODUCT,
  });

  return (
    <div className="site-container">
      <div className="site-header">
        <h1>All Product Categories</h1>
        <p>
          Explore our products by browsing through all available categories.
        </p>
        <Suspense fallback={null}>
          <ProductSearch />
        </Suspense>
      </div>
      <ProductCategoriesClient categories={categories} />
    </div>
  );
}

export const metadata = {
  title: "Product Categories",
  description: "Browse all our artisans' products by category",
};
