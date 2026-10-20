import Link from "next/link";

import { buildPageMetadata } from "~/lib/seo/page-metadata";
import { shopPath } from "~/lib/seo/paths";
import { collectionPageSchema } from "~/lib/seo/schema";
import {
  getLocationLandingPages,
  getTagLandingPages,
} from "~/server/seo/landing-pages";
import { api } from "~/trpc/server";
import { JsonLd } from "~/components/seo/json-ld";
import { BrowseLandingLinks } from "~/app/(site)/(shops-goods-services)/shops/_components/landing-page";
import { ShopCard } from "~/app/(site)/(shops-goods-services)/shops/_components/shop-card";

const DESCRIPTION = "Browse all our artisans' stores";

export default async function ShopsPage() {
  const shops = await api.shop.getAllPublic();
  // Only landing pages with enough shops exist; none yet renders nothing.
  const [locations, tags] = await Promise.all([
    getLocationLandingPages().catch(() => []),
    getTagLandingPages().catch(() => []),
  ]);

  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: "Artisan shops",
          description: DESCRIPTION,
          path: "/shops",
          items: shops.map((shop) => ({
            name: shop.name,
            path: shopPath(shop),
          })),
        })}
      />
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
        <BrowseLandingLinks locations={locations} tags={tags} />
      </section>
    </>
  );
}

export async function generateMetadata() {
  return buildPageMetadata({
    title: "Shops",
    description: DESCRIPTION,
    path: "/shops",
  });
}
