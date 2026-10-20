import { api } from "~/trpc/server";

import { TrailHeader } from "../../_components/trail-header";
import { ProductImportWizard } from "./_components/product-import-wizard";

export default async function DatabaseMigrationPage() {
  const shops = await api.shop.getAll();
  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "Migrate Products" },
        ]}
      />
      <div className="admin-container">
        <ProductImportWizard shops={shops} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Migrate Products",
};
