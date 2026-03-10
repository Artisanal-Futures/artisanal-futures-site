import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ShopForm } from "../_components/shop-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};
export default async function EditShopPage({ params }: Props) {
  const { id } = await params;
  const shop = await api.shop.get(id);
  const potentialShopOwners = await api.shop.getShopOwners();
  const session = await getSession();

  const userRole = session?.user.role ?? "ARTISAN";

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Shops", href: "/admin/shops" },
          { label: shop?.name ?? "Shop" },
        ]}
      />

      <ShopForm
        initialData={shop}
        userRole={userRole}
        potentialShopOwners={potentialShopOwners}
      />
    </>
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const shop = await api.shop.get(id);
  return {
    title: `Edit ${shop?.name ?? "Shop"}`,
  };
};
