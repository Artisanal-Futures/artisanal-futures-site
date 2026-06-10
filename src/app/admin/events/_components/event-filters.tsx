"use client";

import type { RouterOutputs } from "~/trpc/react";

type Event = RouterOutputs["event"]["getAll"][number];

export const createEventFilter = (events: Event[]) => {
  // Build distinct shop options from all events in the current data set
  const shopMap = new Map<string, string>();
  for (const event of events) {
    shopMap.set(event.shop.id, event.shop.name);
  }
  const shopOptions = Array.from(shopMap.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, name]) => ({ value: id, label: name }));

  return shopOptions.length > 0
    ? [
        {
          column: "shopId",
          title: "Shop",
          filters: shopOptions,
        },
      ]
    : [];
};
