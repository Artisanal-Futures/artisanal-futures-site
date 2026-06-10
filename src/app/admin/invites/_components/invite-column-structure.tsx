"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { RouterOutputs } from "~/trpc/react";
import { Checkbox } from "~/components/ui/checkbox";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";

export type InviteRow = RouterOutputs["invite"]["listInvites"][number];

export const inviteColumns: ColumnDef<InviteRow>[] = [
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
    accessorKey: "email",
    size: 240,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "role",
    size: 110,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => (
      <span className="text-sm capitalize">{row.original.role.toLowerCase()}</span>
    ),
  },
  {
    accessorKey: "code",
    size: 140,
    header: "Code",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.code}</span>
    ),
  },
  {
    accessorKey: "status",
    size: 120,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      const badge =
        status === "pending"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
          : status === "used"
            ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      return (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "expiresAt",
    size: 120,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Expires" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.expiresAt.toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    size: 120,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.createdAt.toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: "creator",
    size: 180,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Created by" />
    ),
    accessorFn: (row) =>
      row.creator?.name ?? row.creator?.email ?? "",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.creator?.name ?? row.original.creator?.email ?? "—"}
      </span>
    ),
  },
];
