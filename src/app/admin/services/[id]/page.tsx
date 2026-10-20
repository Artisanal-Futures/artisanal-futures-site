import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";

import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ServiceForm } from "../_components/service-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};
// api.service.get throws for artisans requesting someone else's service, and returns
// null for a missing record. Both should render a 404 rather than a "new" form.
async function getServiceOrNotFound(id: string) {
  try {
    const service = await api.service.get(id);
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

export default async function EditServicePage({ params }: Props) {
  const { id } = await params;
  const service = await getServiceOrNotFound(id);
  const shops = await api.shop.getAll();
  const categories = await api.category.getAll();
  const session = await getSession();
  const userRole = session?.user.role ?? "ARTISAN";
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
      />
    </>
  );
}
export const generateMetadata = async ({ params }: Props) => {
  const { id } = await params;
  const service = await api.service.get(id).catch(() => null);
  if (!service) {
    return {
      title: "Service Not Found",
    };
  }
  return {
    title: `Edit ${service.name}`,
  };
};
