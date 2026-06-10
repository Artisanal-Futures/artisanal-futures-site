"use client";

import { useState } from "react";
import { Package, Wrench } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { ProductCard } from "../../../_components/product-card";
import { ProductDetailDialog } from "../../../_components/product-detail-dialog";

type Product = NonNullable<RouterOutputs["shop"]["get"]>["products"][number];
type Service = NonNullable<RouterOutputs["shop"]["get"]>["services"][number];

export function ProductServiceGrid({
  products,
  services,
  shop,
}: {
  products?: Product[];
  services?: Service[];
  shop: NonNullable<RouterOutputs["shop"]["get"]>;
}) {
  const [selectedItem, setSelectedItem] = useState<Product | Service | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasProducts = products && products.length > 0;
  const hasServices = services && services.length > 0;

  if (!hasProducts && !hasServices) return null;

  const handleItemClick = (item: Product | Service) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  // Only one tab? Render the grid directly
  const onlyProducts = hasProducts && !hasServices;
  const onlyServices = hasServices && !hasProducts;

  if (onlyProducts || onlyServices) {
    const items = onlyProducts ? products : services;
    const label = onlyProducts ? "Products" : "Services";
    return (
      <section className="flex flex-col gap-6">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          {label}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items!.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onClick={() => handleItemClick(item)}
              fallbackImage={shop?.logoPhoto}
            />
          ))}
        </div>
        <ProductDetailDialog
          item={selectedItem as Product}
          open={dialogOpen}
          linkToWebsite={shop?.website ?? undefined}
          onOpenChange={setDialogOpen}
          shopPrinciples={shop?.attributeTags ?? []}
          fallbackImage={shop?.logoPhoto}
        />
      </section>
    );
  }

  return (
    <section>
      <Tabs defaultValue="products" className="gap-6">
        <TabsList className="h-10">
          <TabsTrigger value="products" className="gap-1.5 px-4">
            <Package className="size-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5 px-4">
            <Wrench className="size-4" />
            Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products!.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services!.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ProductDetailDialog
        item={selectedItem as Service}
        open={dialogOpen}
        shopPrinciples={shop?.attributeTags ?? []}
        onOpenChange={setDialogOpen}
        linkToWebsite={shop?.website ?? undefined}
        fallbackImage={shop?.logoPhoto}
      />
    </section>
  );
}
