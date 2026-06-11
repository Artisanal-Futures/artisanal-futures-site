"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { MoreHorizontalIcon } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";

import { ChangeUserRoleDialog } from "./change-user-role-dialog";
import { SendResetPasswordDialog } from "./send-reset-password-dialog";

export type UserRow = RouterOutputs["user"]["listUsers"][number];

type RoleValue = UserRow["role"];

const roleBadge = (role: RoleValue) => {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "ARTISAN":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "MANAGER":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "DRIVER":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case "USER":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "GUEST":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

function UserRowActions({ user }: { user: UserRow }) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/users/${user.id}`}>View details</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setRoleDialogOpen(true)}>
            Change role
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setResetDialogOpen(true)}
            disabled={!user.hasCredential}
          >
            Send reset password
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangeUserRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        userId={user.id}
        userName={user.name}
        currentRole={user.role}
      />

      <SendResetPasswordDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        userId={user.id}
        userEmail={user.email}
      />
    </>
  );
}

export const userColumns: ColumnDef<UserRow>[] = [
  {
    id: "user",
    size: 260,
    accessorFn: (row) => `${row.name ?? ""} ${row.email ?? ""}`,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => {
      const { name, email, image } = row.original;
      const initials = (name ?? email ?? "?")
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={image ?? undefined} alt={name ?? "User"} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {name ?? "—"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {email ?? "—"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    size: 110,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = row.original.role;
      return (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge(role)}`}
        >
          {role.charAt(0) + role.slice(1).toLowerCase()}
        </span>
      );
    },
  },
  {
    id: "authMethod",
    accessorFn: (row) => (row.hasCredential ? "credential" : "social"),
    size: 110,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Auth" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.hasCredential ? "Credential" : "Social"}
      </span>
    ),
  },
  {
    id: "verified",
    accessorFn: (row) => (row.emailVerified ? "yes" : "no"),
    size: 90,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Verified" />
    ),
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.emailVerified ? "Yes" : "No"}
      </span>
    ),
  },
  {
    id: "owns",
    size: 200,
    header: "Owns",
    enableSorting: false,
    cell: ({ row }) => {
      const c = row.original._count;
      const parts = [
        c.shops > 0 ? `${c.shops} shop${c.shops !== 1 ? "s" : ""}` : null,
        c.posts > 0 ? `${c.posts} post${c.posts !== 1 ? "s" : ""}` : null,
        c.forumComments > 0
          ? `${c.forumComments} comment${c.forumComments !== 1 ? "s" : ""}`
          : null,
      ].filter(Boolean);
      return (
        <span className="text-xs text-muted-foreground">
          {parts.length > 0 ? parts.join(" · ") : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    size: 120,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Joined" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.createdAt.toLocaleDateString()}
      </span>
    ),
  },
  {
    id: "options",
    size: 60,
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => <UserRowActions user={row.original} />,
  },
];
