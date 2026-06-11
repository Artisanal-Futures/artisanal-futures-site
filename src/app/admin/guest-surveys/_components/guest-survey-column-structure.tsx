import type { ColumnDef } from "@tanstack/react-table";

import type { GuestSurveyColumn } from "../_validators/types";
import { cn } from "~/lib/utils";
import { Checkbox } from "~/components/ui/checkbox";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";

import { ViewGuestSurveyDialog } from "./view-prompt-dialog";

export const guestSurveyColumnStructure: ColumnDef<GuestSurveyColumn>[] = [
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
    id: "user",
    size: 300,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="User" />
    ),
    accessorFn: (row) => `${row?.name ?? "Guest"} ${row?.email ?? "No email"}`,
    cell: ({ row }) => (
      <div className="flex flex-col items-start space-y-1">
        <div className={cn("mx-0 px-0 text-sm font-medium text-gray-700")}>
          {row.original?.name ?? row.original.user?.name ?? "Guest"}
        </div>
        <div className="text-xs text-gray-500">
          {row.original?.email ?? row.original.user?.email ?? "No email"}
        </div>
        <div className="text-xs text-gray-400">
          User ID: {row.original?.user?.id ?? "No ID"}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    size: 220,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col items-start">
        <div className={cn("mx-0 px-0 text-sm font-medium text-gray-700")}>
          {new Date(row.original.createdAt).toLocaleDateString()} at{" "}
          {new Date(row.original.createdAt).toLocaleTimeString()}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "prompt",
    size: 240,
    header: "Email",
    cell: ({ row }) => <>{row.original.email ?? ""}</>,
  },

  {
    id: "actions",
    size: 120,
    enableSorting: false,
    cell: ({ row }) => <ViewGuestSurveyDialog item={row.original} />,
  },
];
