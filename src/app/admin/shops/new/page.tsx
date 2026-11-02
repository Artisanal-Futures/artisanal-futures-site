import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ShopForm } from "../_components/shop-form";
import { ShopHubShell } from "../_components/shop-hub-shell";
import { TrailHeader } from "../../_components/trail-header";

export default async function NewShopPage() {
  const session = await getSession();

  const userRole = session?.user.role ?? "ARTISAN";
  const sectors = await api.shopSector.getAll();

  // Admin-only: artisans would receive FORBIDDEN from this procedure.
  const potentialShopOwners =
    userRole === "ADMIN" ? await api.shop.getShopOwners() : [];

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Shops", href: "/admin/shops" },
          { label: "New Shop" },
        ]}
      />

      <ShopHubShell title="New Shop">
        <ShopForm
          initialData={null}
          userRole={userRole}
          sectors={sectors}
          potentialShopOwners={potentialShopOwners}
        />
      </ShopHubShell>
    </>
  );
}
export const metadata = {
  title: "Add Shop",
};
