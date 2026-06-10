"use client";

import Link from "next/link";
import { PencilIcon } from "lucide-react";

import { type ColumnDef, type FilterFn } from "@tanstack/react-table";

import type { ProductWithRelations } from "~/types/product";
import { cn } from "~/lib/utils";
import { handleImageUrl } from "~/lib/handle-image-url";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { RowImageLink } from "~/components/admin/row-image-link";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";

import { DeleteProductDialog } from "./delete-product-dialog";

export type ProductColumnEntry = ProductWithRelations & {
  searchableString: string;
};

export const productColumns: ColumnDef<ProductColumnEntry>[] = [
  {
    id: "select",
    size: 48,
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
    size: 360,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <>
        <RowImageLink
          id={row.original.id}
          name={`${row.original.name}`}
          image={row.original.imageUrl ?? ""}
          fallbackImage={(() => {
            const logo = row.original.shop?.logoPhoto;
            if (!logo?.trim() || logo === "null") return undefined;
            return logo.startsWith("http") ? logo : handleImageUrl(logo);
          })()}
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
    size: 160,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Shop" />
    ),
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col space-y-1">
        <span className="truncate">{row.original.shop?.name}</span>
        {/* <span className="text-muted-foreground text-xs">
          Shop ID: {row.original.shopId}
        </span> */}
      </div>
    ),
  },
  {
    accessorKey: "categories",
    size: 220,
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
    size: 110,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Price" />
    ),
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
    size: 120,
    header: "Visibility",
    cell: ({ row }) =>
      row.original.isPublic ? (
        <Badge
          variant="default"
          className="bg-green-100 text-xs font-normal text-green-800 hover:bg-green-100"
        >
          Public
        </Badge>
      ) : (
        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
          Hidden
        </Badge>
      ),
    enableSorting: false,
    filterFn: ((row, _columnId, filterValues: string[]) => {
      if (!filterValues.length) return true;
      return filterValues.includes(String(row.original.isPublic));
    }) as FilterFn<ProductColumnEntry>,
  },

  {
    id: "options",
    size: 220,
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

  // ── Hidden helper columns for faceted filters ─────────────────────────────
  {
    id: "categoryIds",
    accessorFn: (row) => row.categories.map((c) => c.id),
    header: () => null,
    cell: () => null,
    enableHiding: true,
    enableSorting: false,
    filterFn: ((row, _columnId, filterValues: string[]) => {
      if (!filterValues.length) return true;
      const ids: string[] = row.original.categories.map((c) => c.id);
      return filterValues.some((fv) => ids.includes(fv));
    }) as FilterFn<ProductColumnEntry>,
  },
  {
    id: "priceStatus",
    accessorFn: (row) => (row.priceInCents ? "set" : "missing"),
    header: () => null,
    cell: () => null,
    enableHiding: true,
    enableSorting: false,
  },
];
