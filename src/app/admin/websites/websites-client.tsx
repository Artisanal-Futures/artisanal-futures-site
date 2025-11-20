"use client";

import { AdminClientLayout } from "~/app/admin/_components/client-layout";
import { ItemDialog } from "~/app/admin/_components/item-dialog";
import { WebsiteProvisionDataTable } from "./data-table";
import { WebsiteProvisionForm } from "~/components/admin/forms/website-form";

export default function WebsitesClient() {
  return (
    <AdminClientLayout
      title="Manage Websites"
      currentPage="Websites"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            All Websites
          </h2>
          <ItemDialog
            type="Website"
            title="Create New Website"
            subtitle="Fill out the form to add a new website."
            mode="create"
            FormComponent={WebsiteProvisionForm}
          />
        </div>
        <WebsiteProvisionDataTable />
      </div>
    </AdminClientLayout>
  );
}
