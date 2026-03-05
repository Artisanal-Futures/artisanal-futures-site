import Link from "next/link";

import { api } from "~/trpc/server";
import { ShopCard } from "~/app/(site)/shops/_components/shop-card";

export default async function ShopsPage() {
  const shops = await api.shop.getAllPublic();

  return (
    <>
      <header className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">
              Local Artisans
            </p>
            <h1 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              Discover Our Makers
            </h1>
          </div>
          <p className="text-foreground/70 max-w-2xl text-base leading-relaxed sm:text-lg">
            Meet the talented artisans in our community. Browse their profiles,
            explore their handcrafted products and services, and support local
            makers directly.
          </p>
          <p className="text-muted-foreground text-sm">
            {shops?.length} {shops?.length === 1 ? "artisan" : "artisans"} in
            the directory
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
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
