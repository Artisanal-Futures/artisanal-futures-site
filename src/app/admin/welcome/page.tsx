import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

import { AdminWelcomeDashboard } from "./_components/admin-welcome-dashboard";

export default async function WelcomePage() {
  const shop = await api.shop.getWelcomeShop();
  const session = await getSession();

  if (!shop) {
    return <div>No shops found</div>;
  }

  return (
    <AdminWelcomeDashboard
      shopData={shop}
      owner={{
        name: session?.user?.name ?? session?.user?.email ?? "",
        photo: session?.user?.image ?? "",
      }}
    />
  );
}
