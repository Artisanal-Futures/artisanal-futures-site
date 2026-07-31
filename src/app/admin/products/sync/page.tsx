import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { TrailHeader } from "../../_components/trail-header";
import { SyncRunsClient } from "./_components/sync-runs-client";

export default async function ProductSyncPage() {
  const [runs, shopConfigs, session] = await Promise.all([
    api.productSync.listRuns({ limit: 50 }),
    api.productSync.listShopConfigs(),
    getSession(),
  ]);

  const isAdmin = session?.user.role === "ADMIN";

  return (
    <>
      <TrailHeader
        breadcrumbs={[
          { label: "Products", href: "/admin/products" },
          { label: "Product Sync" },
        ]}
      />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Product Sync</h1>
            <p>
              {isAdmin
                ? "Keep every artisan's catalog in step with their own website. Nothing goes live until it's approved."
                : "Keep your products in step with your own website. Nothing changes until you approve it."}
            </p>
          </div>
        </div>
        <SyncRunsClient
          runs={runs}
          shopConfigs={shopConfigs}
          isAdmin={isAdmin}
        />
      </div>
    </>
  );
}

export const metadata = {
  title: "Product Sync",
};
