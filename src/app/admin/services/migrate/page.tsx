import { notFound } from "next/navigation";

import { DatabaseMigrationClient } from "../_components/service-migration-client";
import { TrailHeader } from "../../_components/trail-header";

export const metadata = {
  title: "Migrate Services",
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
          { label: "Services", href: "/admin/services" },
          { label: "Migrate Services" },
        ]}
      />
      <div className="admin-container">
        <DatabaseMigrationClient />
      </div>
    </>
  );
}
