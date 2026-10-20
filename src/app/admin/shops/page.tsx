import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { ShopClient } from "./_components/shop-client";

export default async function ShopsAdminPage() {
  const [shops, session] = await Promise.all([
    api.shop.getAll(),
    getSession(),
  ]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: isAdmin ? "Shops" : "My Shop" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>{isAdmin ? "All Shops" : "My Shop"}</h1>
            <p>
              {isAdmin ? "Manage shops for AF Artisans" : "Manage your shop"}
            </p>
          </div>
        </div>
        <ShopClient shops={shops} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Shops",
};
