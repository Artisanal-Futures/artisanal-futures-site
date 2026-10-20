import { Suspense } from "react";

import { buildPageMetadata } from "~/lib/seo/page-metadata";
import { api } from "~/trpc/server";
import { Skeleton } from "~/components/ui/skeleton";

import { ArtisanMapExplorer } from "./_components/artisan-map-explorer";

export async function generateMetadata() {
  return buildPageMetadata({
    title: "Artisan Map",
    description: "Explore Artisanal Futures artisans on an interactive map.",
    path: "/tools/artisan-map",
  });
}

export default async function ArtisanMapPage() {
  const shops = await api.shop.getMapLocations();

  return (
    // Navbar is h-16 plus a 1px border; the footer follows below this block.
    <div className="flex h-[calc(100dvh-4rem-1px)] min-h-[560px] flex-col">
      <header className="flex shrink-0 flex-col gap-0.5 border-b px-4 py-3 sm:flex-row sm:items-baseline sm:gap-x-4 sm:px-6 lg:px-8">
        <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
          Artisan Map
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Discover artisans in our network. Storefronts are pinned exactly;
          everyone else shows an approximate area, never a home address.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="min-h-0 flex-1 rounded-none" />}>
        <ArtisanMapExplorer shops={shops} />
      </Suspense>
    </div>
  );
}
