import { cache } from "react";
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";

import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ServiceForm } from "../_components/service-form";
import { TrailHeader } from "../../_components/trail-header";
import { safeAdminReturnTo } from "../../_lib/safe-return-to";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};
// Deduped per request so the page and generateMetadata share one query.
const getService = cache((id: string) => api.service.get(id));

// api.service.get throws for artisans requesting someone else's service, and returns
// null for a missing record. Both should render a 404 rather than a "new" form.
async function getServiceOrNotFound(id: string) {
  try {
    const service = await getService(id);
    if (!service) return notFound();
    return service;
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

export default async function EditServicePage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const [service, shops, categories, session] = await Promise.all([
    getServiceOrNotFound(id),
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
          { label: "Services", href: "/admin/services" },
          { label: service?.name ?? "Service" },
        ]}
      />

      <ServiceForm
        initialData={service}
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
  const service = await getService(id).catch(() => null);
  if (!service) {
    return {
      title: "Service Not Found",
    };
  }
  return {
    title: `Edit ${service.name}`,
  };
};
