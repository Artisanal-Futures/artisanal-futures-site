"use client";

import { useMemo, useState } from "react";

import { type RowSelectionState } from "@tanstack/react-table";

import type { FilterOption } from "~/components/tables/advanced-data-table";
import type { RouterOutputs } from "~/trpc/react";
import { usePermissions } from "~/hooks/use-permissions";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ShopBulkActions } from "./shop-bulk-actions";
import { shopColumns } from "./shop-column-structure";
import { createShopFilters } from "./shop-filters";

type Props = {
  shops: RouterOutputs["shop"]["getAll"];
};

export function ShopClient({ shops }: Props) {
  const { isAdmin } = usePermissions();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const shopFilter = createShopFilters(shops, isAdmin);

  const selectedShopIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => shops[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, shops]);

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="name"
        searchPlaceholder="Filter by shop name..."
        columns={shopColumns}
        mobileHiddenColumnIds={["owner", "createdAt"]}
        data={shops ?? []}
        filters={shopFilter as FilterOption[]}
        defaultColumnVisibility={{
          owner: isAdmin,
        }}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        selectionActions={
          <ShopBulkActions
            selectedShopIds={selectedShopIds}
            onClear={() => setRowSelection({})}
          />
        }
      />
    </div>
  );
}
