import { api } from "~/trpc/server";

import { AdminClientLayout } from "../_components/client-layout";
import { TrailHeader } from "../_components/trail-header";
import { ServiceClient } from "./_components/service-client";

export default async function ServicesAdminPage() {
  const rawServices = await api.service.getAll();
  const shops = await api.shop.getAll();

  const services = rawServices.filter(
    (s): s is NonNullable<typeof s> => s?.shop !== null,
  );

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Services" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All Services</h1>
            <p>Manage services for AF Artisans</p>
          </div>
        </div>
        <ServiceClient services={services} shops={shops} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Services",
};
