"use client";

import Link from "next/link";

import { Category, Product, Service } from "@prisma/client";

import { ProductWithRelations } from "~/types/product";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { buttonVariants } from "~/components/ui/button";
import { NewProductCard } from "~/app/(site)/products/_components/new-product-card";

export function ProductCategoriesClient({
  categories,
}: {
  categories: (Category & { items: Product[] | Service[] })[];
}) {
  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <div key={category.id}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              <Link
                href={`/product-category/${encodeURIComponent(category.name)}`}
                className="hover:underline"
              >
                {category.name}
              </Link>
            </h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/product-category/${encodeURIComponent(category.name)}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                View All {category.name}s
              </Link>
            </div>
          </div>
          {/* {category.children.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {category.children.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/product-category/${encodeURIComponent(category.name)}?subcategory=${encodeURIComponent(sub.name)}`}
                  className="block rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent"
                >
                  <h3 className="font-semibold">{sub.name}</h3>
                </Link>
              ))}
            </div>
          )} */}
          {category.items.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {category.items.map((product) => (
                <NewProductCard
                  key={product.id}
                  product={product as ProductWithRelations}
                />

                // <Link
                //   key={product.id}
                //   href={`/product/${product.id}`}
                //   className="block rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent"
                // >
                //   <h3 className="font-semibold">{product.name}</h3>
                // </Link>
              ))}
            </div>
          )}
          {category?.items?.length === 0 && (
            <p className="text-left text-muted-foreground">
              No products found for the selected filters.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
