import { api } from "~/trpc/server";

import { CategoryForm } from "../_components/category-form";
import { TrailHeader } from "../../_components/trail-header";

export default async function NewCategoryPage() {
  const categories = await api.category.getAll();

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Categories", href: "/admin/categories" },
          { label: "New Category" },
        ]}
      />

      <CategoryForm initialData={null} categories={categories} />
    </>
  );
}
export const metadata = {
  title: "Add Category",
};
