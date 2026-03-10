import { Suspense } from "react";
import { CategoryType } from "generated/prisma";

import { api } from "~/trpc/server";

import { ProductSearch } from "../../_components/product-search";
import { ProductCategoriesClient } from "./_components/product-categories-client";

export default async function ProductCategoriesPage() {
  const categories = await api.category.getCategoriesWithFeaturedProducts({
    type: CategoryType.PRODUCT,
  });

  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Artisan Products</p>
            <h1>Product Categories</h1>
          </div>
          <p className="description">
            Explore our makers&apos; products by browsing through different
            categories.
          </p>
        </div>
      </header>

      <section className="site-section">
        <Suspense fallback={null}>
          <ProductSearch type="products" />
        </Suspense>
        <ProductCategoriesClient categories={categories} />{" "}
      </section>
    </>
  );
}

export const metadata = {
  title: "Product Categories",
  description: "Browse all our artisans' products by category",
};
