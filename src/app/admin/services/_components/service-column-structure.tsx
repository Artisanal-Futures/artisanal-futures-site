"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { RowImageLink } from "~/components/admin/row-image-link";
import { ItemDialog } from "../../_components/item-dialog";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { ServiceForm } from "./service-form";
import type { ServiceWithShop } from "~/types/service";

export type ServiceColumnEntry = ServiceWithShop & {
  searchableString: string;
};

export const serviceColumns: ColumnDef<ServiceColumnEntry>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "searchableString",
    header: "Title",
    cell: ({ row }) => (
      <RowImageLink
        id={row.original.id}
        name={`${row.original.name} • #${row.original.id}`}
        image={row.original.imageUrl ?? ""}
        hasLink={false}
        subheader={`Created on ${row.original.createdAt.toLocaleDateString()}`}
      />
    ),
  },
  {
    accessorKey: "shopId",
    header: "Shop",
    cell: ({ row }) => (
      <div className="flex flex-col space-y-1">
        <span>{row.original.shop?.name}</span>
        <span className="text-xs text-muted-foreground">
          Shop ID: {row.original.shopId}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "categories",
    header: "Categories",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.categories?.length > 0 ? (
          row.original.categories.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="text-xs font-normal"
            >
              {category.name}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Uncategorized</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "priceInCents",
    header: "Price",
    cell: ({ row }) => (
      <span>
        {row.original.priceInCents
          ? `${row.original.currency ?? "USD"} ${(
              row.original.priceInCents / 100
            ).toFixed(2)}`
          : "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "isPublic",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isPublic ? "default" : "secondary"}>
        {row.original.isPublic ? "Public" : "Draft"}
      </Badge>
    ),
  },
  {
    id: "options",
    header: "Options",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <ItemDialog
          id={row.original.id}
          title={`Update ${row.original.name}`}
          subtitle="Make changes to the service"
          initialData={row.original}
          FormComponent={ServiceForm}
          mode="update"
        />
        <DeleteServiceDialog serviceId={row.original.id} />
      </div>
    ),
  },
];