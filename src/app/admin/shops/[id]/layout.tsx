import { shopPath } from "~/lib/seo/paths";
import { api, HydrateClient } from "~/trpc/server";

import { OwnerChip } from "../_components/owner-chip";
import { ShopHubNav } from "../_components/shop-hub-nav";
import { ShopHubShell } from "../_components/shop-hub-shell";
import { TrailHeader } from "../../_components/trail-header";
import { getAdminShop } from "./_lib/get-admin-shop";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

/**
 * Shared chrome for a shop's admin pages (Details, Products, Services, Sync, Insights).
 * Access is checked here for the header, but each page must still call
 * `getAdminShop` itself.
 */
export default async function ShopHubLayout({ params, children }: Props) {
  const { id } = await params;
  const { shop, isAdmin } = await getAdminShop(id);

  // The admin layout's HydrateClient has already dehydrated, so the owner
  // chip's query needs its own boundary.
  if (isAdmin) void api.shop.getOwnership.prefetch({ shopId: shop.id });

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Shops", href: "/admin/shops" },
          { label: shop.name },
        ]}
      />

      <HydrateClient>
        <ShopHubShell
          title={shop.name}
          viewHref={shopPath({ id: shop.id, slug: shop.slug })}
          isPublic={shop.isPublic}
          ownerChip={
            isAdmin ? (
              <OwnerChip shopId={shop.id} shopName={shop.name} />
            ) : undefined
          }
          nav={<ShopHubNav shopId={shop.id} />}
        >
          {children}
        </ShopHubShell>
      </HydrateClient>
    </>
  );
}
