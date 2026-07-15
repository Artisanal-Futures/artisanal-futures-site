import Link from "next/link";

import { api } from "~/trpc/server";
import { ShopCard } from "~/app/(site)/(shops-goods-services)/shops/_components/shop-card";

export default async function ShopsPage() {
  const shops = await api.shop.getAllPublic();

  return (
    <>
      <header className="site-header">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="tagline">Local Artisans</p>
            <h1>Meet Our Makers and Providers</h1>
          </div>
          <p className="description">
            Meet the talented artisans and providers in our community. Browse
            their profiles, explore their products and services, and support
            small businesses directly.
          </p>
          <p className="text-muted-foreground text-sm">
            {shops?.length} {shops?.length === 1 ? "member" : "members"} in the
            directory
          </p>
        </div>
      </header>

      <section className="site-section">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export const metadata = {
  title: "Shops",
  description: "Browse all our artisans' stores",
};
