import { cache } from "react";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";

import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ProductForm } from "../_components/product-form";
import { TrailHeader } from "../../_components/trail-header";
import { safeAdminReturnTo } from "../../_lib/safe-return-to";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};
// Deduped per request so the page and generateMetadata share one query.
const getProduct = cache((id: string) => api.product.get(id));

// api.product.get throws for artisans requesting someone else's product, and returns
// null for a missing record. Both should render a 404 rather than a "new" form.
async function getProductOrNotFound(id: string) {
  try {
    const product = await getProduct(id);
    if (!product) return notFound();
    return product;
  } catch (error) {
    if (
      error instanceof TRPCError &&
      ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND"].includes(error.code)
    ) {
      return notFound();
    }
    throw error;
  }
}

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const [product, shops, categories, session] = await Promise.all([
    getProductOrNotFound(id),
    api.shop.getOptions(),
    api.category.getAll(),
    getSession(),
  ]);

  const userRole = session?.user.role ?? "ARTISAN";
  const returnTo = safeAdminReturnTo(query.returnTo) ?? undefined;

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
        returnTo={returnTo}
      />
    </>
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const product = await getProduct(id).catch(() => null);
  if (!product) {
    return {
      title: "Product Not Found",
    };
  }
  return {
    title: `Edit ${product.name}`,
  };
};
