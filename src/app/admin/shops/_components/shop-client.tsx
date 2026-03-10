"use client";

import type { FilterOption } from "~/components/tables/advanced-data-table";
import type { RouterOutputs } from "~/trpc/react";
import { usePermissions } from "~/hooks/use-permissions";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { shopColumns } from "./shop-column-structure";
import { createShopFilters } from "./shop-filters";

type Props = {
  shops: RouterOutputs["shop"]["getAll"];
};

export function ShopClient({ shops }: Props) {
  const { isAdmin } = usePermissions();

  const shopFilter = createShopFilters(shops, isAdmin);

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="name"
        searchPlaceholder="Filter by shop name..."
        columns={shopColumns}
        data={shops ?? []}
        filters={shopFilter as FilterOption[]}
        defaultColumnVisibility={{
          owner: isAdmin,
        }}
      />
    </div>
  );
}
