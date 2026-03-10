import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ProductForm } from "../_components/product-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};
export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await api.product.get(id);
  const shops = await api.shop.getAll();
  const categories = await api.category.getAll();
  const session = await getSession();

  const userRole = session?.user.role ?? "ARTISAN";

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: product?.name ?? "Product" },
        ]}
      />

      <ProductForm
        initialData={product}
        shops={shops}
        categories={categories}
        userRole={userRole}
      />
    </>
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const product = await api.product.get(id);
  if (!product) {
    return {
      title: "Product Not Found",
    };
  }
  return {
    title: `Edit ${product.name}`,
  };
};
