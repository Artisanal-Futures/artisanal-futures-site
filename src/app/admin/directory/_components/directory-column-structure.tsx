"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import Link from "next/link";
import { Lock, MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import type { DirectoryRow } from "~/server/api/routers/shops";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import { CopyButton } from "./copy-button";

/** Faceted filter: the toolbar stores an array of selected values. */
const facetedFilter: FilterFn<DirectoryRow> = (
  row,
  columnId,
  filterValues: string[],
) => {
  if (!filterValues?.length) return true;
  return filterValues.includes(row.getValue<string>(columnId));
};

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const normalizeUrl = (value: string) =>
  /^https?:\/\//i.test(value) ? value : `https://${value}`;

const displayHost = (value: string) => {
  try {
    const url = new URL(normalizeUrl(value));
    const path = url.pathname === "/" ? "" : url.pathname;
    return `${url.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return value.replace(/^https?:\/\//i, "");
  }
};

const copyToClipboard = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Couldn't copy to clipboard");
  }
};

const PrivateMarker = () => (
  <span
    className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-muted-foreground"
    title="Private contact (admin only)"
  >
    <Lock className="size-3" />
    private
  </span>
);

const Dash = () => <span className="text-sm text-muted-foreground">—</span>;

function DirectoryRowActions({
  row,
  onView,
}: {
  row: DirectoryRow;
  onView: (row: DirectoryRow) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={(e) => {
          e.stopPropagation();
          onView(row);
        }}
      >
        View
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={stop}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={stop}>
          <DropdownMenuItem
            disabled={!row.contactEmail}
            onClick={stop}
            onSelect={() => {
              if (row.contactEmail) void copyToClipboard(row.contactEmail, "Email");
            }}
          >
            Copy email
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!row.contactPhone}
            onClick={stop}
            onSelect={() => {
              if (row.contactPhone)
                void copyToClipboard(row.contactPhone, "Phone");
            }}
          >
            Copy phone
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {row.shopId && (
            <DropdownMenuItem asChild>
              <Link href={`/admin/shops/${row.shopId}`} onClick={stop}>
                Open shop admin
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={`/admin/users/${row.owner.id}`} onClick={stop}>
              View user account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function createDirectoryColumns({
  onView,
}: {
  onView: (row: DirectoryRow) => void;
}): ColumnDef<DirectoryRow>[] {
  return [
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
          onClick={stop}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "contact",
      size: 260,
      accessorFn: (row) =>
        [
          row.shopName,
          row.contactName,
          row.contactEmail,
          row.accountEmail,
          row.phone,
          row.contactPhone,
          row.privateContact?.name,
          row.privateContact?.email,
          row.privateContact?.phone,
          row.location,
        ]
          .filter(Boolean)
          .join(" "),
      header: ({ column }) => (
        <AdvancedDataTableColumnHeader column={column} title="Artisan" />
      ),
      cell: ({ row }) => {
        const r = row.original;
        const label = r.shopName ?? r.contactName ?? r.owner.email ?? "?";
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={r.logoPhoto ?? undefined} alt={label} />
              <AvatarFallback className="text-xs">
                {getInitials(label)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-start">
              {r.kind === "shop" ? (
                r.shopId ? (
                  <Link
                    href={`/admin/shops/${r.shopId}`}
                    onClick={stop}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {r.shopName ?? "Unnamed shop"}
                  </Link>
                ) : (
                  <span className="truncate text-sm font-medium">
                    {r.shopName ?? "Unnamed shop"}
                  </span>
                )
              ) : (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-xs font-normal text-muted-foreground"
                >
                  No shop yet
                </Badge>
              )}
              {r.managedByAdmin && (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0 text-[10px] font-normal text-amber-700 dark:text-amber-400"
                >
                  Managed by admin
                </Badge>
              )}
              <span className="max-w-full truncate text-xs text-muted-foreground">
                {r.contactName || "—"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "email",
      size: 240,
      accessorFn: (row) => row.contactEmail ?? "",
      header: ({ column }) => (
        <AdvancedDataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        const { contactEmail, shopEmail, accountEmail, privateContact } =
          row.original;
        const managedByAdmin = row.original.managedByAdmin;
        if (!contactEmail) return <Dash />;
        const isPrivate =
          !!privateContact?.email && contactEmail === privateContact.email;
        const hasDifferentAccountEmail =
          !managedByAdmin &&
          !!shopEmail &&
          !!accountEmail &&
          shopEmail !== accountEmail;
        return (
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-1">
              <a
                href={`mailto:${contactEmail}`}
                onClick={stop}
                className="truncate text-sm hover:underline"
              >
                {contactEmail}
              </a>
              <CopyButton value={contactEmail} label="Email" />
              {isPrivate && <PrivateMarker />}
            </div>
            {hasDifferentAccountEmail && (
              <span
                className="w-fit text-xs text-muted-foreground"
                title={accountEmail}
              >
                + account email
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "phone",
      size: 170,
      accessorFn: (row) => row.contactPhone ?? "",
      header: ({ column }) => (
        <AdvancedDataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => {
        const { contactPhone: phone, privateContact } = row.original;
        if (!phone) return <Dash />;
        const isPrivate = !!privateContact?.phone && phone === privateContact.phone;
        return (
          <div className="flex min-w-0 items-center gap-1">
            <a
              href={`tel:${phone}`}
              onClick={stop}
              className="truncate text-sm hover:underline"
            >
              {phone}
            </a>
            <CopyButton value={phone} label="Phone" />
            {isPrivate && <PrivateMarker />}
          </div>
        );
      },
    },
    {
      id: "website",
      size: 180,
      accessorFn: (row) => row.website ?? "",
      header: ({ column }) => (
        <AdvancedDataTableColumnHeader column={column} title="Website" />
      ),
      cell: ({ row }) => {
        const { website } = row.original;
        if (!website) return <Dash />;
        return (
          <a
            href={normalizeUrl(website)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            className="block truncate text-sm hover:underline"
          >
            {displayHost(website)}
          </a>
        );
      },
    },
    {
      id: "location",
      size: 150,
      accessorFn: (row) => row.location ?? "",
      header: ({ column }) => (
        <AdvancedDataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) =>
        row.original.location ? (
          <span className="text-sm">{row.original.location}</span>
        ) : (
          <Dash />
        ),
    },
    {
      accessorKey: "kind",
      size: 100,
      header: ({ column }) => (
        <AdvancedDataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.kind === "shop" ? "Shop" : "No shop yet"}
        </span>
      ),
      filterFn: facetedFilter,
    },
    {
      id: "visibility",
      size: 100,
      accessorFn: (row) =>
        row.kind === "no-shop" || row.isPublic === null
          ? "n/a"
          : row.isPublic
            ? "public"
            : "hidden",
      header: ({ column }) => (
        <AdvancedDataTableColumnHeader column={column} title="Visibility" />
      ),
      cell: ({ row }) => {
        const { kind, isPublic } = row.original;
        if (kind === "no-shop" || isPublic === null) return null;
        return isPublic ? (
          <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Public
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            Hidden
          </span>
        );
      },
      filterFn: facetedFilter,
    },
    {
      id: "state",
      size: 80,
      accessorFn: (row) => row.address?.state ?? "",
      header: ({ column }) => (
        <AdvancedDataTableColumnHeader column={column} title="State" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.address?.state ?? "—"}</span>
      ),
      filterFn: facetedFilter,
    },
    {
      id: "managed",
      size: 100,
      accessorFn: (row) => (row.managedByAdmin ? "admin" : "artisan"),
      header: ({ column }) => (
        <AdvancedDataTableColumnHeader column={column} title="Ownership" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.managedByAdmin ? "Managed by admin" : "Artisan-owned"}
        </span>
      ),
      filterFn: facetedFilter,
    },
    {
      id: "actions",
      size: 130,
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <DirectoryRowActions row={row.original} onView={onView} />
      ),
    },
  ];
}
