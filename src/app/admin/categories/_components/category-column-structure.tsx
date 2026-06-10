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

import { DeleteCategoryDialog } from "./delete-category-dialog";

export type CategoryColumnEntry = RouterOutputs["category"]["getAll"][number];

export const categoryColumns: ColumnDef<CategoryColumnEntry>[] = [
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
    accessorKey: "name",
    size: 320,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <RowCellIdDisplay id={row.original.id} label={row.original.name} />
    ),
  },
  {
    accessorKey: "parent",
    size: 240,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Parent Category" />
    ),
    cell: ({ row }) => {
      const parent = row.original.parent;
      return parent ? (
        <span className="text-sm">{parent.name}</span>
      ) : (
        <span className="text-muted-foreground text-sm">None (Top-Level)</span>
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.parent?.name ?? "";
      const b = rowB.original.parent?.name ?? "";
      return a.localeCompare(b);
    },
  },
  {
    id: "actions",
    size: 200,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link
          href={`/admin/categories/${row.original.id}`}
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-8 bg-blue-500 text-xs hover:bg-blue-600",
          )}
        >
          <PencilIcon className="mr-1 h-4 w-4" /> Edit
        </Link>
        <DeleteCategoryDialog categoryId={row.original.id} />
      </div>
    ),
  },

  // ── Hidden helper columns for faceted filters ─────────────────────────────
  {
    id: "categoryType",
    accessorFn: (row) => row.type ?? "",
    header: () => null,
    cell: () => null,
    enableHiding: true,
    enableSorting: false,
    filterFn: ((row, _columnId, filterValues: string[]) => {
      if (!filterValues.length) return true;
      return filterValues.includes(row.original.type ?? "");
    }) as FilterFn<CategoryColumnEntry>,
  },
  {
    id: "parentId",
    accessorFn: (row) => row.parentId ?? "",
    header: () => null,
    cell: () => null,
    enableHiding: true,
    enableSorting: false,
    filterFn: ((row, _columnId, filterValues: string[]) => {
      if (!filterValues.length) return true;
      return filterValues.includes(row.original.parentId ?? "none");
    }) as FilterFn<CategoryColumnEntry>,
  },
];
