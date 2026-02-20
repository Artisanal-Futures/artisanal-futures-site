"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { type Category } from "generated/prisma";
import { type ColumnDef } from "@tanstack/react-table";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { DataTable } from "~/components/ui/data-table";
import { ItemDialog } from "~/app/admin/_components/item-dialog";
import { RowCellIdDisplay } from "~/app/admin/_components/row-cell-id-display";
import { SingleActionDialog } from "~/app/admin/_components/single-action-dialog";
import { CategoryForm } from "~/app/admin/categories/_components/category-form";

type CategoryWithParent = Category & {
  parent: Category | null;
};

export const columns: ColumnDef<CategoryWithParent>[] = [
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
    cell: ({ row }) => {
      const category = row.original;
      const utils = api.useUtils();
      const router = useRouter();

      const deleteMutation = api.category.delete.useMutation({
        onSuccess: () => {
          toast.dismiss();
          toast.success("Category deleted successfully.");
          router.refresh();
        },
        onError: (error) => {
          toast.dismiss();
          toast.error(`Error deleting category: ${error.message}`);
        },
        onSettled: () => {
          void utils.category.getAll.invalidate();
        },
        onMutate: () => {
          toast.loading("Deleting category...");
        },
      });

      return (
        <div className="flex items-center justify-end space-x-2">
          <ItemDialog
            id={category.id}
            title="Edit Category"
            subtitle="Update the details for this category."
            initialData={category}
            FormComponent={CategoryForm}
          />
          <SingleActionDialog
            title="Delete Category"
            description={`Are you sure you want to delete the "${category.name}" category? This action cannot be undone.`}
            actionText="Delete"
            onSubmit={() => deleteMutation.mutate({ id: category.id })}
            isLoading={deleteMutation.isPending}
            icon={TrashIcon}
            color="red"
          />
        </div>
      );
    },
  },
];

export function CategoryDataTable({
  categories,
}: {
  categories: RouterOutputs["category"]["getAll"];
}) {
  return (
    <DataTable<CategoryWithParent, unknown>
      columns={columns}
      data={(categories as CategoryWithParent[]) ?? []}
      searchKey="name"
    />
  );
}
