"use client";

import { AdminClientLayout } from "~/app/admin/_components/client-layout";
import { ItemDialog } from "~/app/admin/_components/item-dialog";
import { CategoryDataTable } from "./data-table";
import { CategoryForm } from "~/components/admin/forms/category-form";

export default function CategoriesClient() {
  return (
    <AdminClientLayout
      title="Manage Categories"
      currentPage="Categories"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            All Categories
          </h2>
          <ItemDialog
            type="Category"
            title="Create New Category"
            subtitle="Fill out the form to add a new category."
            mode="create"
            FormComponent={CategoryForm}
          />
        </div>
        <CategoryDataTable />
      </div>
    </AdminClientLayout>
  );
}
