"use client";

import type { DirectoryRow } from "~/server/api/routers/shops";

export const createDirectoryFilters = (rows: DirectoryRow[]) => {
  const stateSet = new Set<string>();
  for (const row of rows) {
    const state = row.address?.state;
    if (state) stateSet.add(state);
  }
  const stateOptions = Array.from(stateSet)
    .sort((a, b) => a.localeCompare(b))
    .map((state) => ({ value: state, label: state }));

  return [
    {
      column: "kind",
      title: "Type",
      filters: [
        { value: "shop", label: "Shop" },
        { value: "no-shop", label: "No shop yet" },
      ],
    },
    {
      column: "visibility",
      title: "Visibility",
      filters: [
        { value: "public", label: "Public" },
        { value: "hidden", label: "Hidden" },
      ],
    },
    {
      column: "state",
      title: "State",
      filters: stateOptions,
    },
  ];
};
