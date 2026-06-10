"use client";

import Link from "next/link";
import { PencilIcon } from "lucide-react";

import { type ColumnDef, type FilterFn } from "@tanstack/react-table";

import type { RouterOutputs } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { RowCellIdDisplay } from "~/app/admin/_components/row-cell-id-display";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";

import { DeleteEventDialog } from "./delete-event-dialog";

export type EventColumnEntry = RouterOutputs["event"]["getAll"][number];

export const eventColumns: ColumnDef<EventColumnEntry>[] = [
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
    accessorKey: "title",
    size: 320,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <RowCellIdDisplay id={row.original.id} label={row.original.title} />
    ),
  },
  {
    accessorKey: "shop",
    size: 200,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Shop" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">{row.original.shop.name}</span>
    ),
    sortingFn: (rowA, rowB) =>
      rowA.original.shop.name.localeCompare(rowB.original.shop.name),
  },
  {
    accessorKey: "startDate",
    size: 150,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Start Date" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.startDate.toLocaleDateString()}
      </span>
    ),
  },

  {
    id: "actions",
    size: 200,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link
          href={`/admin/events/${row.original.id}`}
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-8 bg-blue-500 text-xs hover:bg-blue-600",
          )}
        >
          <PencilIcon className="mr-1 h-4 w-4" /> Edit
        </Link>
        <DeleteEventDialog eventId={row.original.id} />
      </div>
    ),
  },

  // ── Hidden helper columns for faceted filters ─────────────────────────────
  {
    id: "shopId",
    accessorFn: (row) => row.shop.id,
    header: () => null,
    cell: () => null,
    enableHiding: true,
    enableSorting: false,
    filterFn: ((row, _columnId, filterValues: string[]) => {
      if (!filterValues.length) return true;
      return filterValues.includes(row.original.shop.id);
    }) as FilterFn<EventColumnEntry>,
  },
];
