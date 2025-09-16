import Link from "next/link";

import { CategoryType } from "@prisma/client";

import { api } from "~/trpc/server";
import SiteLayout from "~/app/(site)/layout";

import { ServiceCategoriesClient } from "./_components/service-categories-client";

export const metadata = {
  title: "All Service Categories",
  description: "Browse all service categories.",
};

export default async function ServiceCategoriesPage() {
  const categories = await api.category.getCategoriesWithFeaturedProducts({
    type: CategoryType.SERVICE,
  });

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            All Service Categories
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Explore our services by browsing through all available categories
            and subcategories.
          </p>
        </div>

        <ServiceCategoriesClient categories={categories} />
      </div>
    </SiteLayout>
  );
}
