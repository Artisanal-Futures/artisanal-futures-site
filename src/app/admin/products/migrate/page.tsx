import { notFound } from "next/navigation";

import { DatabaseMigrationClient } from "../_components/product-migration-client";
import { AdminClientLayout } from "../../_components/client-layout";

export const metadata = {
  title: "Migrate Products",
};

export default async function DatabaseMigrationPage() {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <AdminClientLayout
      currentPage="Migrate Products"
      title="Migrate Products"
      breadcrumbs={[{ label: "Products", href: "/admin/products" }]}
    >
      <DatabaseMigrationClient />
    </AdminClientLayout>
  );
}
