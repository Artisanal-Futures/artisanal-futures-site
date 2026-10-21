import { api } from "~/trpc/server";

import { PrivateContactCard } from "../_components/private-contact-card";
import { ShopForm } from "../_components/shop-form";
import { ShopOwnerCard } from "../_components/shop-owner-card";
import { getAdminShop } from "./_lib/get-admin-shop";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditShopPage({ params }: Props) {
  const { id } = await params;
  const { shop, userRole, isAdmin } = await getAdminShop(id);

  // Admin-only procedure: artisans would receive FORBIDDEN from it.
  const privateContact = isAdmin
    ? await api.shop.getPrivateContact(shop.id)
    : null;

  return (
    <ShopForm
      initialData={shop}
      userRole={userRole}
      adminSlot={
        isAdmin
          ? {
              main: <ShopOwnerCard shopId={shop.id} shopName={shop.name} />,
              aside: (
                <PrivateContactCard shopId={shop.id} initial={privateContact} />
              ),
            }
          : undefined
      }
    />
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const shop = await getAdminShop(id)
    .then((result) => result.shop)
    .catch(() => null);
  return {
    title: `Edit ${shop?.name ?? "Shop"}`,
  };
};
