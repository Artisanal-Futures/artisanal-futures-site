import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ShopForm } from "../_components/shop-form";
import { TrailHeader } from "../../_components/trail-header";

export default async function NewShopPage() {
  const potentialShopOwners = await api.shop.getShopOwners();
  const session = await getSession();

  const userRole = session?.user.role ?? "ARTISAN";

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Shops", href: "/admin/shops" },
          { label: "New Shop" },
        ]}
      />

      <ShopForm
        initialData={null}
        userRole={userRole}
        potentialShopOwners={potentialShopOwners}
      />
    </>
  );
}
export const metadata = {
  title: "Add Shop",
};
