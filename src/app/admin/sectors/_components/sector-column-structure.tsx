"use client";

import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { PencilIcon } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { SECTOR_PALETTE, sectorColor } from "~/lib/constants/shop-sectors";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { RowCellIdDisplay } from "~/app/admin/_components/row-cell-id-display";
import { SectorSwatch } from "~/app/admin/_components/sector-swatch";

import { DeleteSectorDialog } from "./delete-sector-dialog";
import { MoveSectorButtons } from "./move-sector-buttons";

export type SectorColumnEntry =
  RouterOutputs["shopSector"]["getAllForAdmin"][number];

// Sorting is off throughout: the rows always show the stored display order,
// which the move buttons change.
export const sectorColumns: ColumnDef<SectorColumnEntry>[] = [
  {
    id: "order",
    size: 96,
    enableSorting: false,
    enableHiding: false,
    header: "Order",
    cell: ({ row, table }) => (
      <MoveSectorButtons
        sectorId={row.original.id}
        sectorName={row.original.name}
        isFirst={row.index === 0}
        isLast={row.index === table.options.data.length - 1}
      />
    ),
  },
  {
    accessorKey: "colorKey",
    size: 140,
    enableSorting: false,
    header: "Color",
    cell: ({ row }) => {
      const { colorKey } = row.original;
      const name =
        SECTOR_PALETTE.find((color) => color.key === colorKey)?.name ??
        "Neutral";
      return (
        <span className="flex items-center gap-2 text-sm">
          <SectorSwatch color={sectorColor(colorKey)} />
          {name}
        </span>
      );
    },
  },
  {
    accessorKey: "name",
    size: 320,
    enableSorting: false,
    header: "Name",
    cell: ({ row }) => (
      <RowCellIdDisplay
        id={row.original.slug}
        identifier="Slug"
        label={row.original.name}
        href={`/admin/sectors/${row.original.id}`}
      />
    ),
  },
  {
    accessorKey: "shortName",
    size: 160,
    enableSorting: false,
    header: "Short Name",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.shortName ?? (
          <span className="text-muted-foreground">Same as name</span>
        )}
      </span>
    ),
  },
  {
    id: "shops",
    size: 96,
    enableSorting: false,
    header: "Shops",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">{row.original._count.shops}</span>
    ),
  },
  {
    id: "actions",
    size: 200,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link
          href={`/admin/sectors/${row.original.id}`}
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-8 bg-blue-500 text-xs text-white hover:bg-blue-600",
          )}
        >
          <PencilIcon className="mr-1 h-4 w-4" /> Edit
        </Link>
        <DeleteSectorDialog
          sectorId={row.original.id}
          sectorName={row.original.name}
          shopCount={row.original._count.shops}
        />
      </div>
    ),
  },
];
