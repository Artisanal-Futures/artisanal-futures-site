import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PencilIcon } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { RowCellIdDisplay } from "~/app/admin/_components/row-cell-id-display";

import { DeleteCategoryDialog } from "./delete-category-dialog";

export const categoryColumns: ColumnDef<
  RouterOutputs["category"]["getAll"][number]
>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <RowCellIdDisplay id={row.original.id} label={row.original.name} />
    ),
  },
  {
    accessorKey: "parent",
    header: "Parent Category",
    cell: ({ row }) => {
      const parent = row.original.parent;
      return parent ? (
        <span className="text-sm">{parent.name}</span>
      ) : (
        <span className="text-muted-foreground text-sm">None (Top-Level)</span>
      );
    },
  },
  {
    id: "actions",
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
];
