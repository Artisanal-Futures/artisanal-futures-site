"use client";

import { type ProductWithRelations } from "~/types/product";

export const createProductFilter = (
  products: ProductWithRelations[],
  shops: { id: string; name: string }[],
) => {
  return [
    {
      column: "shopId",
      title: "Shop",
      filters: shops.map((shop) => ({
        value: shop.id,
        label: shop.name,
      })),
    },
  ].flat();
};
