"use client";

import type { User } from "@prisma/client";

import type { FilterOption } from "~/components/tables/advanced-data-table";
import { type Shop } from "~/types/shop";
import { usePermissions } from "~/hooks/use-permissions";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ItemDialog } from "../../_components/item-dialog";
import { shopColumns } from "./shop-column-structure";
import { createShopFilters } from "./shop-filters";
import { ShopForm } from "./shop-form";

type Props = { shops: (Shop & { owner: User })[] };

export function ShopClient({ shops }: Props) {
  const { isAdmin } = usePermissions();

  const shopFilter = createShopFilters(shops, isAdmin);

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="shopName"
        searchPlaceholder="Filter by shop name..."
        columns={shopColumns}
        data={shops ?? []}
        filters={shopFilter as FilterOption[]}
        defaultColumnVisibility={{
          owner: isAdmin,
        }}
        addButton={
          isAdmin && (
            <ItemDialog
              title={`Create shop`}
              subtitle="Create a new shop"
              FormComponent={ShopForm}
              type="shop"
              mode="create"
              contentClassName="max-w-5xl w-full"
            />
          )
        }
      />
    </div>
  );
}
