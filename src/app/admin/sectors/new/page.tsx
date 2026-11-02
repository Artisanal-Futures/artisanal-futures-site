import { api } from "~/trpc/server";

import { SectorForm } from "../_components/sector-form";
import { TrailHeader } from "../../_components/trail-header";

export default async function NewSectorPage() {
  const sectors = await api.shopSector.getAll();

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Sectors", href: "/admin/sectors" },
          { label: "New Sector" },
        ]}
      />

      <SectorForm initialData={null} sectors={sectors} />
    </>
  );
}
export const metadata = {
  title: "Add Sector",
};
