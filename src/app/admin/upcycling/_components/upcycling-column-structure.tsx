import { type ColumnDef } from "@tanstack/react-table";

import { cn } from "~/lib/utils";
import { Checkbox } from "~/components/ui/checkbox";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";

import { type UpcyclingColumn } from "../_validators/types";
import { DeleteItemBtn } from "./delete-item-btn";
import { ViewLikeDialog } from "./view-like-dialog";
import { ViewUpcycleDialog } from "./view-upcycle-dialog";

export const upcyclingColumnStructure: ColumnDef<UpcyclingColumn>[] = [
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
    size: 280,
    accessorFn: (row) =>
      `${row.user?.name ?? "Guest"} ${row.user?.email ?? "No email"}`,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="User" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col items-start space-y-1">
        <div className={cn("mx-0 px-0 text-sm font-medium text-gray-700")}>
          {row.original.user?.name ?? "Guest"}
        </div>
        <div className="text-xs text-gray-500">
          {row.original.user?.email ?? "No email"}
        </div>
        <div className="text-xs text-gray-400">
          ID: {row.original.user?.id ?? "No ID"}
        </div>
      </div>
    ),
  },

  {
    accessorKey: "generation_date",
    size: 240,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col items-start">
        <div className={cn("mx-0 px-0 text-sm font-medium text-gray-700")}>
          {new Date(row.original.generation_date).toLocaleDateString()} at{" "}
          {new Date(row.original.generation_date).toLocaleTimeString()}
        </div>
        <div className="text-xs text-gray-500">
          Generation took {row.original.generation_time}s
        </div>
      </div>
    ),
  },
  {
    accessorKey: "prompt",
    size: 280,
    header: "Prompt",
    cell: ({ row }) => <>{row.original.prompt ?? ""}</>,
  },
  {
    accessorKey: "like",
    size: 100,
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Like" />
    ),
    cell: ({ row }) => <ViewLikeDialog item={row.original} />,
  },

  {
    id: "details",
    size: 120,
    header: "Details",
    enableSorting: false,
    cell: ({ row }) => <ViewUpcycleDialog item={row.original} />,
  },

  {
    id: "delete",
    size: 100,
    header: "Delete",
    enableSorting: false,
    cell: ({ row }) => <DeleteItemBtn id={row.original.id} />,
  },
];
