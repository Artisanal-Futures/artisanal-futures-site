import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ServiceForm } from "../_components/service-form";
import { TrailHeader } from "../../_components/trail-header";

export default async function NewServicePage() {
  const shops = await api.shop.getAll();
  const categories = await api.category.getAll();
  const session = await getSession();

  const userRole = session?.user.role ?? "ARTISAN";

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Services", href: "/admin/services" },
          { label: "New Service" },
        ]}
      />

      <ServiceForm
        initialData={null}
        shops={shops}
        categories={categories}
        userRole={userRole}
      />
    </>
  );
}
export const metadata = {
  title: "Add Service",
};
