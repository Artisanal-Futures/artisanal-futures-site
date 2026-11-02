import { cache } from "react";
import { notFound } from "next/navigation";

import { api } from "~/trpc/server";

import { SectorForm } from "../_components/sector-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};

// Deduped per request so the page and generateMetadata share one query.
const getSector = cache((id: string) => api.shopSector.get(id));

export default async function EditSectorPage({ params }: Props) {
  const { id } = await params;
  const [sector, sectors] = await Promise.all([
    getSector(id),
    api.shopSector.getAll(),
  ]);
  if (!sector) notFound();

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Sectors", href: "/admin/sectors" },
          { label: sector.name },
        ]}
      />

      <SectorForm initialData={sector} sectors={sectors} />
    </>
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const sector = await getSector(id).catch(() => null);
  if (!sector) {
    return {
      title: "Sector Not Found",
    };
  }
  return {
    title: `Edit ${sector.name}`,
  };
};
