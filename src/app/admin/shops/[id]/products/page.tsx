import { api } from "~/trpc/server";

import { getAdminShop } from "../_lib/get-admin-shop";
import { ProductClient } from "../../../products/_components/product-client";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShopProductsPage({ params }: Props) {
  const { id } = await params;
  const { shop } = await getAdminShop(id);
  const products = await api.product.getAll({ shopId: shop.id });

  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold">Products</h2>
      <p className="text-muted-foreground text-sm">
        Everything {shop.name} sells. Edits return you here.
      </p>
      <ProductClient
        products={products}
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
          returnTo: `/admin/shops/${shop.id}/products`,
        }}
      />
    </div>
  );
}

export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const { shop } = await getAdminShop(id);
  return { title: `Products · ${shop.name}` };
};
