import Link from "next/link";

import { api } from "~/trpc/server";
import { ShopCard } from "~/app/(site)/shops/_components/shop-card";

export default async function ShopsPage() {
  const shops = await api.shop.getAllValid();

  return (
    <div className="site-container">
      <div className="site-header">
        <h1>Artisanal Shops</h1>
        <p>Discover unique handcrafted goods from our featured artisans</p>
      </div>

      {shops?.length === 0 ? (
        <div className="bg-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground text-xl">
            We don&apos;t have any shops set up at the moment.{" "}
            <Link
              href="/profile/shop"
              className="text-primary font-medium hover:underline"
            >
              Create your shop here
            </Link>{" "}
            and be the first to join our marketplace!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              className="transform transition duration-300 hover:scale-105"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const metadata = {
  title: "Shops",
  description: "Browse all our artisans' stores",
};
