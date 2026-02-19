"use client";

import type { RouterOutputs } from "~/trpc/react";

export const createShopFilters = (
  shops: RouterOutputs["shop"]["getAll"],
  isElevated: boolean,
) => {
  const owners = [
    ...new Map(shops.map((shop) => [shop.owner?.id, shop.owner])).values(),
  ].filter(Boolean);

  return [
    {
      column: "name",
      title: "Shop Name",
      filters: shops.map((shop) => ({
        value: shop.name,
        label: shop.name,
      })),
    },
    isElevated
      ? {
          column: "owner",
          title: "Owner",
          filters: owners.map((owner) => ({
            value: owner.id,
            label: owner.name,
          })),
        }
      : [],
  ].flat();
};
