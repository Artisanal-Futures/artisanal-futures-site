import { api } from "~/trpc/server";

import { AdminClientLayout } from "../_components/client-layout";
import { ProductClient } from "./_components/product-client";

export const metadata = {
  title: "Products",
};

export default async function ProductsAdminPage() {
  const products = await api.product.getAll();
  const shops = await api.shop.getAll();

  return (
    <AdminClientLayout currentPage="Products" title="Products">
      <ProductClient products={products} shops={shops} />
    </AdminClientLayout>
  );
}
