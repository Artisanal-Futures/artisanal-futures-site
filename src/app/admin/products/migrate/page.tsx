import { notFound } from "next/navigation";

import { DatabaseMigrationClient } from "../_components/product-migration-client";
import { TrailHeader } from "../../_components/trail-header";

export const metadata = {
  title: "Migrate Products",
};

export default async function DatabaseMigrationPage() {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

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
