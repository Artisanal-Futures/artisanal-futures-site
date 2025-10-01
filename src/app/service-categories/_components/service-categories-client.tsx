"use client";

import Link from "next/link";

import type { Category, Product, Service } from "@prisma/client";

import type { ServiceWithShop } from "~/types/service";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { NewServiceCard } from "~/app/(site)/services/_components/new-service-card";

type Props = {
  categories: (Category & { items: Product[] | Service[] })[];
};

export function ServiceCategoriesClient({ categories }: Props) {
  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <div key={category.id}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              <Link
                href={`/service-category/${encodeURIComponent(category.name)}`}
                className="hover:underline"
              >
                {category.name}
              </Link>
            </h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/service-category/${encodeURIComponent(category.name)}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                View All {category.name}s
              </Link>
            </div>
          </div>
          {category.items.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {category.items.map((product) => (
                <NewServiceCard
                  key={product.id}
                  service={product as ServiceWithShop}
                />
              ))}
            </div>
          )}
          {category?.items?.length === 0 && (
            <p className="text-left text-muted-foreground">
              No services found for the selected filters.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
