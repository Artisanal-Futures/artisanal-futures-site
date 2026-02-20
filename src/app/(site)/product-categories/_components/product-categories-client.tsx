"use client";

import Link from "next/link";
import { type Category, type Product, type Service } from "generated/prisma";

import { type ProductWithRelations } from "~/types/product";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { NewProductCard } from "~/app/(site)/product-categories/_components/new-product-card";

type Props = {
  categories: (Category & { items: Product[] | Service[] })[];
};
export function ProductCategoriesClient({ categories }: Props) {
  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <div key={category.id}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              <Link
                href={`/product-categories/${encodeURIComponent(category.name)}`}
                className="hover:underline"
              >
                {category.name}
              </Link>
            </h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/product-categories/${encodeURIComponent(category.name)}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                View All {category.name}s
              </Link>
            </div>
          </div>

          {category.items.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {category.items.map((product) => (
                <NewProductCard
                  key={product.id}
                  product={product as ProductWithRelations}
                />
              ))}
            </div>
          )}
          {category?.items?.length === 0 && (
            <p className="text-muted-foreground text-left">
              No products found for the selected filters.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
