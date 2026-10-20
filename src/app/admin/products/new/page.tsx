import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ProductForm } from "../_components/product-form";
import { TrailHeader } from "../../_components/trail-header";
import { safeAdminReturnTo } from "../../_lib/safe-return-to";

type Props = {
  searchParams: Promise<{
    shopId?: string | string[];
    returnTo?: string | string[];
  }>;
};

export default async function NewProductPage({ searchParams }: Props) {
  const query = await searchParams;
  const [shops, categories, session] = await Promise.all([
    api.shop.getOptions(),
    api.category.getAll(),
    getSession(),
  ]);

  const userRole = session?.user.role ?? "ARTISAN";

  // Only preselect a shop the viewer could pick anyway.
  const defaultShopId = shops.find((shop) => shop.id === query.shopId)?.id;
  const returnTo = safeAdminReturnTo(query.returnTo) ?? undefined;

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "New Product" },
        ]}
      />

      <ProductForm
        initialData={null}
        shops={shops}
        categories={categories}
        userRole={userRole}
        defaultShopId={defaultShopId}
        returnTo={returnTo}
      />
    </>
  );
}
export const metadata = {
  title: "Add Product",
};
