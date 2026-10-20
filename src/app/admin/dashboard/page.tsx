import type { Role } from "generated/prisma";

import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { TrailHeader } from "../_components/trail-header";
import { DashboardClient } from "./_components/dashboard-client";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminPage() {
  const [session, shops] = await Promise.all([
    getSession(),
    api.shop.getAll(),
  ]);
  const artisanShop = shops.find((shop) => shop.ownerId === session?.user?.id);

  return (
    <>
      <TrailHeader breadcrumbs={[]} />
      <div className="admin-container">
        <div className="flex items-center justify-center p-8">
          <DashboardClient
            shops={shops}
            user={{
              name: session?.user?.name ?? "",
              photo: session?.user?.image ?? "",
              role: session?.user?.role as Role,
              shopId: artisanShop?.id ?? "",
            }}
          />
        </div>
      </div>
    </>
  );
}
