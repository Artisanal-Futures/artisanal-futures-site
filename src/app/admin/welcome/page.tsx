import Link from "next/link";

import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";

import { TrailHeader } from "../_components/trail-header";
import { AdminWelcomeDashboard } from "./_components/admin-welcome-dashboard";

export default async function WelcomePage() {
  const [shop, session] = await Promise.all([
    api.shop.getWelcomeShop(),
    getSession(),
  ]);

  // getWelcomeShop always returns an object; the shop itself may be null.
  if (!shop?.shop) {
    return (
      <>
        <TrailHeader breadcrumbs={[{ label: "Welcome" }]} />
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-foreground text-2xl font-bold">
            {"You don't have a shop yet"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Create your shop to start adding products and services and get your
            free website.
          </p>
          <Button asChild>
            <Link href="/admin/shops/new">Create My Shop</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <TrailHeader breadcrumbs={[{ label: "Welcome" }]} />
      <AdminWelcomeDashboard
        shopData={shop}
        owner={{
          name: session?.user?.name ?? session?.user?.email ?? "",
          photo: session?.user?.image ?? "",
        }}
      />
    </>
  );
}
