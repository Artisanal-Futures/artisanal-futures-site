import { notFound } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { PrivateContactCard } from "../_components/private-contact-card";
import { ShopForm } from "../_components/shop-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};
export default async function EditShopPage({ params }: Props) {
  const { id } = await params;
  const shop = await api.shop.get(id);
  if (!shop) notFound();
  const session = await getSession();

  const userRole = session?.user.role ?? "ARTISAN";

  // `shop.get` is public, so it returns other artisans' public shops too.
  if (userRole !== "ADMIN" && shop.ownerId !== session?.user.id) notFound();

  // Admin-only procedures: artisans would receive FORBIDDEN from these.
  const potentialShopOwners =
    userRole === "ADMIN" ? await api.shop.getShopOwners() : [];
  const privateContact =
    userRole === "ADMIN" && shop ? await api.shop.getPrivateContact(id) : null;

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

      {userRole === "ADMIN" && shop && (
        <div className="admin-container pt-0">
          <PrivateContactCard shopId={shop.id} initial={privateContact} />
        </div>
      )}
    </>
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const shop = await api.shop.get(id).catch(() => null);
  return {
    title: `Edit ${shop?.name ?? "Shop"}`,
  };
};
