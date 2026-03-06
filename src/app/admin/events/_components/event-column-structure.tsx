import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PencilIcon } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { RowCellIdDisplay } from "~/app/admin/_components/row-cell-id-display";

import { DeleteEventDialog } from "./delete-event-dialog";

export const eventColumns: ColumnDef<
  RouterOutputs["event"]["getAll"][number]
>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <RowCellIdDisplay id={row.original.id} label={row.original.title} />
    ),
  },
  {
    accessorKey: "shop",
    header: "Shop",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.shop.name}</span>
    ),
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.startDate.toLocaleDateString()}
      </span>
    ),
  },

  {
    id: "actions",
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
];
