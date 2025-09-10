import { notFound } from "next/navigation";

import { DatabaseMigrationClient } from "../_components/service-migration-client";
import { AdminClientLayout } from "../../_components/client-layout";

export const metadata = {
  title: "Migrate Services",
};

export default async function DatabaseMigrationPage() {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <AdminClientLayout
      currentPage="Migrate Services"
      title="Migrate Services"
      breadcrumbs={[{ label: "Services", href: "/admin/services" }]}
    >
      <DatabaseMigrationClient />
    </AdminClientLayout>
  );
}
