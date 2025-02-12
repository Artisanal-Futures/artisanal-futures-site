"use client";

import { type Product } from "~/types/product";
import { type Shop } from "~/types/shop";

export const createProductFilter = (products: Product[], shops: Shop[]) => {
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
