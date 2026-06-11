"use client";

import type { RouterOutputs } from "~/trpc/react";

type Category = RouterOutputs["category"]["getAll"][number];

export const createCategoryFilter = (categories: Category[]) => {
  // Build distinct parent options from all categories in the current data set
  const parentMap = new Map<string, string>();
  for (const cat of categories) {
    if (cat.parent) {
      parentMap.set(cat.parent.id, cat.parent.name);
    }
  }
  const parentOptions = Array.from(parentMap.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, name]) => ({ value: id, label: name }));

  const filters = [
    {
      column: "categoryType",
      title: "Type",
      filters: [
        { value: "PRODUCT", label: "Product" },
        { value: "SERVICE", label: "Service" },
      ],
    },
    ...(parentOptions.length > 0
      ? [
          {
            column: "parentId",
            title: "Parent",
            filters: parentOptions,
          },
        ]
      : []),
  ];

  return filters;
};
