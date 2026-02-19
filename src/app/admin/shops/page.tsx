import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { ItemDialog } from "../_components/item-dialog";
import { TrailHeader } from "../_components/trail-header";
import { ShopClient } from "./_components/shop-client";
import { ShopForm } from "./_components/shop-form";

export default async function ShopsAdminPage() {
  const shops = await api.shop.getAll();
  const session = await getSession();

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Shops" }]} />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>All Shops</h1>
            <p>Manage shops for AF Artisans</p>
          </div>

          {session?.user?.role === "ADMIN" && (
            <ItemDialog
              type="Shop"
              title="Create New Shop"
              subtitle="Fill out the form to add a new shop."
              mode="create"
              FormComponent={ShopForm}
              contentClassName="sm:max-w-5xl w-full"
            />
          )}
        </div>
        <ShopClient shops={shops} />
      </div>
    </>
  );
}

export const metadata = {
  title: "Shops",
};
