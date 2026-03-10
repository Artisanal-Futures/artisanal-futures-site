import { api } from "~/trpc/server";

import { CategoryForm } from "../_components/category-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};
export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const category = await api.category.get(id);
  const categories = await api.category.getAll();

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Categories", href: "/admin/categories" },
          { label: category?.name ?? "Category" },
        ]}
      />

      <CategoryForm initialData={category} categories={categories} />
    </>
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const category = await api.category.get(id);
  if (!category) {
    return {
      title: "Category Not Found",
    };
  }
  return {
    title: `Edit ${category.name}`,
  };
};
