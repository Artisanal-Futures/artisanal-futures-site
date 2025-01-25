import type { User } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";

import type { Shop } from "~/types/shop";
import { env } from "~/env";
import { RowImageLink } from "~/components/admin/row-image-link";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";

import { ItemDialog } from "../../_components/item-dialog";
import { DeleteShopDialog } from "./delete-shop-dialog";
import { ShopForm } from "./shop-form";

export const shopColumns: ColumnDef<Shop & { owner: User }>[] = [
  {
    accessorKey: "name",
    header: "Shop name",
    accessorFn: (row) => row.name,
    filterFn: "includesString",
    cell: ({ row }) => (
      <RowImageLink
        id={row.original.id}
        name={`${row.original.name} `}
        image={`${env.NEXT_PUBLIC_STORAGE_URL}/shops/${row.original.logoPhoto}`}
        hasLink={false}
        subheader={`Created on ${row.original.createdAt.toLocaleDateString()}`}
      />
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    accessorFn: (row) => row.owner?.id,
    filterFn: "arrIncludesSome",
    cell: ({ row }) => (
      <div className="flex flex-col space-y-1">
        <span>{row.original.owner?.name}</span>
        <span className="text-xs text-muted-foreground">
          Owner ID: {row.original.ownerId}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Created on" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">
        {row.original.createdAt.toLocaleDateString()}
      </span>
    ),
  },
  {
    id: "options",
    header: "Options",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <DeleteShopDialog shopId={row.original.id} />

        <ItemDialog
          id={row.original.id}
          title={`Update shop`}
          subtitle="Make changes to the shop"
          initialData={row.original}
          FormComponent={ShopForm}
          contentClassName="sm:max-w-6xl"
          mode="update"
        />
      </div>
    ),
  },
];
