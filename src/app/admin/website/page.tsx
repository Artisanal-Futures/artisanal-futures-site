import { TrailHeader } from "../_components/trail-header";
import { WebsiteProvisionClient } from "./_components/website-provision-client";

export default async function AdminWebsitesPage() {
  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Website Provision" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1> Create Your Free Website</h1>
            <p>
              {" "}
              Every artisan deserves an online presence. We offer free website
              hosting so you can focus on your craft, not technical details.
            </p>
          </div>
        </div>

        <WebsiteProvisionClient />
      </div>
    </>
  );
}

export const metadata = {
  title: "Website Provision",
};
