"use client";

import { useState } from "react";
import Link from "next/link";

import type { RouterOutputs } from "~/trpc/react";
import { type ProductWithRelations } from "~/types/product";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";

import { ProductCard } from "../../../_components/product-card";
import { ProductDetailDialog } from "../../../_components/product-detail-dialog";

type Props = {
  categories: NonNullable<
    RouterOutputs["category"]["getCategoriesWithFeaturedProducts"]
  >;
};

type Product = NonNullable<RouterOutputs["shop"]["get"]>["products"][number];
type Service = NonNullable<RouterOutputs["shop"]["get"]>["services"][number];

export function ProductCategoriesClient({ categories }: Props) {
  const [selectedItem, setSelectedItem] = useState<Product | Service | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const handleItemClick = (item: Product | Service) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-12">
      {categories.map((category) => (
        <div key={category.id}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              <Link
                href={`/collections/products/${encodeURIComponent(category.name.toLowerCase())}`}
                className="hover:underline"
              >
                {category.name}
              </Link>
            </h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/collections/products/${encodeURIComponent(category.name.toLowerCase())}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                View All {category.name}s
              </Link>
            </div>
          </div>

          {category.items.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {category.items.map((product) => (
                <ProductCard
                  key={product.id}
                  item={product as Product}
                  onClick={() => handleItemClick(product as Product)}
                  createdBy={product?.shop?.name ?? ""}
                  shopPrinciples={product?.shop?.attributeTags ?? []}
                />
              ))}
            </div>
          )}

          <ProductDetailDialog
            item={selectedItem as Product}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            createdBy={(selectedItem as ProductWithRelations)?.shop?.name ?? ""}
            shopPrinciples={
              (selectedItem as ProductWithRelations)?.shop?.attributeTags ?? []
            }
            linkToProfile={`/shops/${(selectedItem as ProductWithRelations)?.shop?.id}`}
          />

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
