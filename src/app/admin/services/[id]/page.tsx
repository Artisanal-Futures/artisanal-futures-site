import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ServiceForm } from "../_components/service-form";
import { TrailHeader } from "../../_components/trail-header";

type Props = {
  params: Promise<{ id: string }>;
};
export default async function EditServicePage({ params }: Props) {
  const { id } = await params;
  const service = await api.service.get(id);
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
  const service = await api.service.get(id);
  if (!service) {
    return {
      title: "Service Not Found",
    };
  }
  return {
    title: `Edit ${service.name}`,
  };
};
