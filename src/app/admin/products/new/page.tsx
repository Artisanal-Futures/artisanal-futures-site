import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ProductForm } from "../_components/product-form";
import { TrailHeader } from "../../_components/trail-header";

export default async function NewProductPage() {
  const shops = await api.shop.getAll();
  const categories = await api.category.getAll();
  const session = await getSession();

  const userRole = session?.user.role ?? "ARTISAN";

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "New Product" },
        ]}
      />

      <ProductForm
        initialData={null}
        shops={shops}
        categories={categories}
        userRole={userRole}
      />
    </>
  );
}
export const metadata = {
  title: "Add Product",
};
