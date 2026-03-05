"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { EyeIcon, PencilIcon } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { RowImageLink } from "~/components/admin/row-image-link";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";

import { DeleteShopDialog } from "./delete-shop-dialog";

function isValidUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    // Accepts http, https, protocol-relative, or root-relative urls
    const pattern = /^(https?:\/\/|\/\/|\/)[^\s/$.?#].[^\s]*$/i;
    return pattern.test(url);
  } catch {
    return false;
  }
}

export const shopColumns: ColumnDef<RouterOutputs["shop"]["getAll"][number]>[] =
  [
    {
      accessorKey: "name",
      header: "Shop name",
      accessorFn: (row) => row.name,
      filterFn: "includesString",
      cell: ({ row }) => (
        <RowImageLink
          id={row.original.id}
          name={`${row.original.name} `}
          image={`${isValidUrl(row.original?.logoPhoto ?? "") ? row.original?.logoPhoto : "/placeholder-image.webp"}`}
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
          <span className="text-muted-foreground text-xs">
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

          <Link
            href={`/admin/shops/${row.original.id}`}
            className={cn(
              buttonVariants({
                variant: "default",
                className: "h-8 bg-blue-500 text-xs hover:bg-blue-600",
              }),
            )}
          >
            <PencilIcon className="mr-1 h-4 w-4" /> Edit
          </Link>

          <Link
            href={`/shops/${row.original.id}`}
            className={cn(
              buttonVariants({
                variant: "default",
                className: "h-8 bg-green-500 text-xs hover:bg-green-600",
              }),
            )}
          >
            <EyeIcon className="mr-1 h-4 w-4" /> View
          </Link>
        </div>
      ),
    },
  ];
