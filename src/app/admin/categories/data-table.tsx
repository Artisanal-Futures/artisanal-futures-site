"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { TrashIcon } from "lucide-react";
import { type Category } from "@prisma/client";

import { api } from "~/trpc/react";
import { DataTable } from "~/components/ui/data-table";
import { ItemDialog } from "~/app/admin/_components/item-dialog";
import { RowCellIdDisplay } from "~/app/admin/_components/row-cell-id-display";
import { SingleActionDialog } from "~/app/admin/_components/single-action-dialog";
import { CategoryForm } from "~/components/admin/forms/category-form";

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
        <span className="text-sm text-muted-foreground">None (Top-Level)</span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original;
      const utils = api.useUtils();

      const deleteMutation = api.category.delete.useMutation({
        onSuccess: async () => {
          toast.success("Category deleted successfully.");
          await utils.category.getAll.invalidate();
        },
        onError: (error) => {
          toast.error(`Error deleting category: ${error.message}`);
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

export function CategoryDataTable() {
  const { data, isLoading } = api.category.getAll.useQuery();

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <DataTable<CategoryWithParent, unknown>
      columns={columns}
      data={data as CategoryWithParent[] ?? []}
      searchKey="name"
    />
  );
}
