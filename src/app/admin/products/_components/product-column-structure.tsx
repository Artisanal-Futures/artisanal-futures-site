"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon } from "lucide-react";

import type { ProductWithRelations } from "~/types/product";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { RowImageLink } from "~/components/admin/row-image-link";

import { DeleteProductDialog } from "./delete-product-dialog";

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
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(!!checked)
        }
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
      <>
        <RowImageLink
          id={row.original.id}
          name={`${row.original.name} • #${row.original.id}`}
          image={row.original.imageUrl ?? ""}
          hasLink={false}
          subheader={`Created on ${row.original.createdAt.toLocaleDateString()}`}
        />
        <span className="text-muted-foreground sr-only text-xs">
          {row.original.searchableString}
        </span>
      </>
    ),
  },
  {
    accessorKey: "shopId",
    header: "Shop",
    cell: ({ row }) => (
      <div className="flex flex-col space-y-1">
        <span>{row.original.shop?.name}</span>
        <span className="text-muted-foreground text-xs">
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
          <span className="text-muted-foreground text-xs">Uncategorized</span>
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
    header: "Visibility",
    cell: ({ row }) =>
      row.original.isPublic ? (
        <Badge variant="default" className="text-xs font-normal">
          Public
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs font-normal">
          Hidden
        </Badge>
      ),
    enableSorting: false,
  },

  {
    id: "options",
    header: "Options",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link
          href={`/admin/products/${row.original.id}`}
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-8 bg-blue-500 text-xs hover:bg-blue-600",
          )}
        >
          <PencilIcon className="mr-1 h-4 w-4" /> Edit
        </Link>
        <DeleteProductDialog productId={row.original.id} />
      </div>
    ),
  },
];
