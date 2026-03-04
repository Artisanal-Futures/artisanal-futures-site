import { api } from "~/trpc/server";

import { ProductForm } from "../_components/product-form";
import { TrailHeader } from "../../_components/trail-header";

export default async function NewProductPage() {
  const shops = await api.shop.getAll();
  const categories = await api.category.getAll();

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "New Product" },
        ]}
      />

      <ProductForm initialData={null} shops={shops} categories={categories} />
    </>
  );
}
export const metadata = {
  title: "Add Product",
};
