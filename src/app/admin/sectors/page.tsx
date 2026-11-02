import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { SectorClient } from "./_components/sector-client";

export default async function AdminSectorsPage() {
  const sectors = await api.shopSector.getAllForAdmin();
  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Sectors" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All Sectors</h1>
            <p>
              Manage what shops can pick as their sector on the Artisan Map.
              Shops without one appear as &quot;Other&quot;.
            </p>
          </div>
        </div>
        <SectorClient sectors={sectors} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Sectors",
};
