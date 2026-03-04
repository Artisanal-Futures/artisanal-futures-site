import Link from "next/link";
import { CirclePlusIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";
import { buttonVariants } from "~/components/ui/button";

import { TrailHeader } from "../_components/trail-header";
import { ShopClient } from "./_components/shop-client";

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
            <Link
              href="/admin/shops/new"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <CirclePlusIcon className="mr-1 h-4 w-4" /> Create New Shop
            </Link>
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
