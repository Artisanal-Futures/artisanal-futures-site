import { api, HydrateClient } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { CategoryClient } from "./_components/category-client";

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
        </div>
        <CategoryClient categories={categories} />
        {/* <CategoryTable /> */}
      </div>
    </>
  );
}

export const metadata = {
  title: "Categories",
};
