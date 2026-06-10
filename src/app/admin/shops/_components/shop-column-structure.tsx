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

const PLACEHOLDER_IMAGE = "/placeholder-image.webp";

// Returns a renderable image src, normalizing (URL-encoding) absolute URLs so
// values containing spaces or other unencoded characters still load. Falls back
// to the placeholder when the value is empty or not a usable url.
function toImageSrc(url?: string | null): string {
  if (!url || typeof url !== "string") return PLACEHOLDER_IMAGE;

  // Root-relative or protocol-relative paths are passed through as-is.
  if (url.startsWith("/")) return url;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return PLACEHOLDER_IMAGE;
    }
    return parsed.href;
  } catch {
    return PLACEHOLDER_IMAGE;
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
          image={toImageSrc(row.original?.logoPhoto)}
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
