import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { DirectoryClient } from "./_components/directory-client";

export default async function AdminDirectoryPage() {
  const rows = await api.shop.getDirectory();

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Artisan Directory" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Artisan Directory</h1>
            <p>
              {rows.length} {rows.length === 1 ? "listing" : "listings"}.
              Contact information for every shop owner and artisan on the
              platform
            </p>
          </div>
        </div>
        <DirectoryClient rows={rows} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Artisan Directory",
};
