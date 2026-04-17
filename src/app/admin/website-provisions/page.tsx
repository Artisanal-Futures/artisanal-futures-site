import { api } from "~/trpc/server";

import { ItemDialog } from "../_components/item-dialog";
import { TrailHeader } from "../_components/trail-header";
import { NewProvisionButton } from "./_components/new-provision-button";
import { WebsiteProvisionDataTable } from "./_components/website-provision-data-table";
import { WebsiteProvisionForm } from "./_components/website-provision-form";

export default async function AdminWebsitesPage() {
  const websiteProvisions = await api.shop.getAllWithWebsites();

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Websites Provisions" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All Websites</h1>
            <p>Manage automated website provisionings for AF Artisans</p>
          </div>

          <ItemDialog
            type="Website"
            title="Create New Website"
            subtitle="Fill out the form to add a new website."
            mode="create"
            FormComponent={WebsiteProvisionForm}
            contentClassName="sm:max-w-xl w-full"
          />
          <NewProvisionButton shops={websiteProvisions} />
        </div>
        <WebsiteProvisionDataTable websiteProvisions={websiteProvisions} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Websites",
};
