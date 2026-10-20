import { api } from "~/trpc/server";

import { getAdminShop } from "../_lib/get-admin-shop";
import { ServiceClient } from "../../../services/_components/service-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShopServicesPage({ params }: Props) {
  const { id } = await params;
  const { shop } = await getAdminShop(id);
  const rawServices = await api.service.getAll({ shopId: shop.id });

  const services = rawServices.filter(
    (s): s is NonNullable<typeof s> => s?.shop !== null,
  );

  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold">Services</h2>
      <p className="text-muted-foreground text-sm">
        Everything {shop.name} offers. Edits return you here.
      </p>
      <ServiceClient
        services={services}
        shops={[
          {
            id: shop.id,
            name: shop.name,
            logoPhoto: shop.logoPhoto,
            ownerId: shop.ownerId,
          },
        ]}
        scope={{
          shopId: shop.id,
          returnTo: `/admin/shops/${shop.id}/services`,
        }}
      />
    </div>
  );
}

export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const { shop } = await getAdminShop(id);
  return { title: `Services · ${shop.name}` };
};
