import { api } from "~/trpc/server";

import { TrailHeader } from "../../_components/trail-header";
import { ProductImportWizard } from "./_components/product-import-wizard";

type Props = {
  searchParams: Promise<{ shopId?: string | string[] }>;
};

export default async function DatabaseMigrationPage({ searchParams }: Props) {
  const query = await searchParams;
  const shops = await api.shop.getAll();

  // Only preselect a shop that is actually in the list.
  const initialShopId = shops.find((shop) => shop.id === query.shopId)?.id;

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "Migrate Products" },
        ]}
      />
      <div className="admin-container">
        <ProductImportWizard shops={shops} initialShopId={initialShopId} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Migrate Products",
};
