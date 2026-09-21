import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { CsvImportWizard } from "./_components/csv-import-wizard";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toImportType(value: string | string[] | undefined) {
  return value === "products" || value === "services" ? value : "products";
}

export default async function CsvImportPage({ searchParams }: Props) {
  const serverSearchParams = await searchParams;
  const [shops, categories] = await Promise.all([
    api.shop.getAll(),
    api.category.getAll(),
  ]);

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "CSV Import" }]} />
      <div className="admin-container">
        <CsvImportWizard
          shops={shops}
          categories={categories}
          initialType={toImportType(serverSearchParams.type)}
        />
      </div>
    </>
  );
}

export const metadata = {
  title: "CSV Import",
};
