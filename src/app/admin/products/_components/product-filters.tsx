"use client";

import { type ProductWithRelations } from "~/types/product";

export const createProductFilter = (
  products: ProductWithRelations[],
  shops: { id: string; name: string }[],
) => {
  // Build distinct category options from all products in the current data set
  const categoryMap = new Map<string, string>();
  for (const product of products) {
    for (const cat of product.categories) {
      categoryMap.set(cat.id, cat.name);
    }
  }
  const categoryOptions = Array.from(categoryMap.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, name]) => ({ value: id, label: name }));

  return [
    {
      column: "shopId",
      title: "Shop",
      filters: shops.map((shop) => ({
        value: shop.id,
        label: shop.name,
      })),
    },
    {
      column: "isPublic",
      title: "Visibility",
      filters: [
        { value: "true", label: "Public" },
        { value: "false", label: "Hidden" },
      ],
    },
    ...(categoryOptions.length > 0
      ? [
          {
            column: "categoryIds",
            title: "Category",
            filters: categoryOptions,
          },
        ]
      : []),
    {
      column: "priceStatus",
      title: "Price",
      filters: [
        { value: "set", label: "Price set" },
        { value: "missing", label: "No price" },
      ],
    },
  ];
};
