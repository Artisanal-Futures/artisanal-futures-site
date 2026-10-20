import { cache } from "react";
import { notFound } from "next/navigation";

import { api } from "~/trpc/server";

import { CategoryForm } from "../_components/category-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};

// Deduped per request so the page and generateMetadata share one query.
const getCategory = cache((id: string) => api.category.get(id));

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;
  const [category, categories] = await Promise.all([
    getCategory(id),
    api.category.getAll(),
  ]);
  if (!category) notFound();

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
  const category = await getCategory(id).catch(() => null);
  if (!category) {
    return {
      title: "Category Not Found",
    };
  }
  return {
    title: `Edit ${category.name}`,
  };
};
