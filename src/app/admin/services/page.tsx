import { api } from "~/trpc/server";

import { AdminClientLayout } from "../_components/client-layout";
import { ServiceClient } from "./_components/service-client";

export const metadata = {
  title: "Services",
};

export default async function ServicesAdminPage() {
  const services = await api.service.getAll();
  const shops = await api.shop.getAll();

  return (
    <AdminClientLayout currentPage="Services" title="Services">
      <ServiceClient services={services} shops={shops} />
    </AdminClientLayout>
  );
}
