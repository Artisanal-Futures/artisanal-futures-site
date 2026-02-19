import { api } from "~/trpc/server";
import { CategoryForm } from "~/app/admin/categories/_components/category-form";

import { ItemDialog } from "../_components/item-dialog";
import { TrailHeader } from "../_components/trail-header";
import { CategoryDataTable } from "./_components/data-table";

export default async function AdminCategoriesPage() {
  const categories = await api.category.getAll();
  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Categories" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All Categories</h1>
            <p>Manage categories for products and services</p>
          </div>

          <ItemDialog
            type="Category"
            title="Create New Category"
            subtitle="Fill out the form to add a new category."
            mode="create"
            FormComponent={CategoryForm}
            contentClassName="sm:max-w-xl w-full"
          />
        </div>
        <CategoryDataTable categories={categories} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Categories",
};
