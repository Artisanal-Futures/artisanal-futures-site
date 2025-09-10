"use client";

import { type ProductWithRelations } from "~/types/product";
import { type Shop } from "~/types/shop";

export const createProductFilter = (products: ProductWithRelations[], shops: Shop[]) => {
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
