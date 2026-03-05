import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { ProductClient } from "./_components/product-client";

export default async function ProductsAdminPage() {
  const products = await api.product.getAll();
  const shops = await api.shop.getAll();

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Shops" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All Products</h1>
            <p>Manage products for AF Artisans</p>
          </div>
        </div>
        <ProductClient products={products} shops={shops} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Products",
};
