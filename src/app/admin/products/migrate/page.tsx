import { notFound } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

import { DatabaseMigrationClient } from "../_components/product-migration-client";
import { AdminClientLayout } from "../../_components/client-layout";

export const metadata = {
  title: "Migrate Products",
};

export default async function DatabaseMigrationPage() {
  const session = await getServerAuthSession();
  // Only show in development
  if (session?.user?.role !== "ADMIN") {
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
