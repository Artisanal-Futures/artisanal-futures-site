import type { ColumnDef } from "@tanstack/react-table";

import type { RouterOutputs } from "~/trpc/react";

export type InviteRow = RouterOutputs["invite"]["listInvites"][number];

export const inviteColumns: ColumnDef<InviteRow>[] = [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span className="text-sm capitalize">{row.original.role.toLowerCase()}</span>
    ),
  },
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.code}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
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
    header: "Expires",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.expiresAt.toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.createdAt.toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: "creator",
    header: "Created by",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.creator?.name ?? row.original.creator?.email ?? "—"}
      </span>
    ),
  },
];
