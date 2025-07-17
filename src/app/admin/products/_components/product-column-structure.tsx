import { type ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "~/components/ui/checkbox";

import { type ProductWithRelations } from "~/types/product";
import { RowImageLink } from "~/components/admin/row-image-link";

import { ItemDialog } from "../../_components/item-dialog";
import { DeleteProductDialog } from "./delete-product-dialog";
import { ProjectForm } from "./product-form";
import { Badge } from "~/components/ui/badge";

export type ProductColumnEntry = ProductWithRelations & {
  searchableString: string;
};

export const productColumns: ColumnDef<ProductColumnEntry>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
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
      <>
        <RowImageLink
          id={row.original.id}
          name={`${row.original.name} • #${row.original.id}`}
          image={row.original.imageUrl ?? ""}
          hasLink={false}
          subheader={`Created on ${row.original.createdAt.toLocaleDateString()}`}
        />
      </>
    ),
  },
  {
    accessorKey: "shopId",
    header: "Shop",
    accessorFn: (row) => row.shop?.id,
    filterFn: "arrIncludesSome",
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
        {row.original.categories.length > 0 ? (
          row.original.categories.map((category) => (
            <Badge key={category.id} variant="secondary" className="text-xs font-normal">
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
    id: "options",
    header: "Options",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <DeleteProductDialog productId={row.original.id} />
        <ItemDialog
          id={row.original.id}
          title={`Update ${row.original.name}`}
          subtitle="Make changes to the product"
          initialData={row.original}
          FormComponent={ProjectForm}
          mode="update"
        />
      </div>
    ),
  },
];
