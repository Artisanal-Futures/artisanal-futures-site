import { DatabaseMigrationClient } from "../_components/product-migration-client";
import { TrailHeader } from "../../_components/trail-header";

export default async function DatabaseMigrationPage() {
  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "Migrate Products" },
        ]}
      />
      <div className="admin-container">
        <DatabaseMigrationClient />
      </div>
    </>
  );
}

export const metadata = {
  title: "Migrate Products",
};
