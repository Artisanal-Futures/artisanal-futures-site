import { TrailHeader } from "../_components/trail-header";
import WebsitesClient from "./_components/websites-client";

export const metadata = {
  title: "Websites",
};

export default async function AdminCategoriesPage() {
  return (
    <>
      <TrailHeader
        breadcrumbs={[{ label: "Websites", href: "/admin/websites" }]}
      />
      <WebsitesClient />
    </>
  );
}
