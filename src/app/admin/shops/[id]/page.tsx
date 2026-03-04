import { api } from "~/trpc/server";

import { ShopForm } from "../_components/shop-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};
export default async function EditShopPage({ params }: Props) {
  const { id } = await params;
  const shop = await api.shop.get(id);

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Shops", href: "/admin/shops" },
          { label: shop?.name ?? "Shop" },
        ]}
      />

      <ShopForm initialData={shop} />
    </>
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const shop = await api.shop.get(id);
  return {
    title: shop?.name ?? "Shop",
  };
};
