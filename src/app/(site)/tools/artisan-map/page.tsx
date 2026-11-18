import { Suspense } from "react";

import { toDisplaySectors } from "~/lib/constants/shop-sectors";
import { buildPageMetadata } from "~/lib/seo/page-metadata";
import { api, HydrateClient } from "~/trpc/server";
import { Skeleton } from "~/components/ui/skeleton";

import { ArtisanMapExplorer } from "./_components/artisan-map-explorer";
import { MapSectorsProvider } from "./_components/map-sectors-context";
import { mapSearchInput } from "./_lib/listing-search";
import { parseMapUrlState } from "./_lib/url-state";

export async function generateMetadata() {
  return buildPageMetadata({
    title: "Artisan Map",
    description: "Explore Artisanal Futures artisans on an interactive map.",
    path: "/tools/artisan-map",
  });
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArtisanMapPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // The same parser the client reads the URL with, so the prefetched query's
  // cache key matches the one the client asks for. A repeated param is an
  // array here, where the client's `URLSearchParams.get` takes the first.
  const { query, category } = parseMapUrlState(
    {
      get: (key) => {
        const value = params[key];
        return (Array.isArray(value) ? value[0] : value) ?? null;
      },
    },
    [],
  );
  const searchInput = mapSearchInput(query, category);

  const [shops, sectors, categoryTree] = await Promise.all([
    api.shop.getMapLocations(),
    api.shopSector.getAll(),
    api.category.getNavigationTree(),
    // Failures are swallowed by `prefetch`; the client then fetches for itself.
    searchInput ? api.shop.searchMapListings.prefetch(searchInput) : undefined,
  ]);

  return (
    // Its own boundary: the layout's may have dehydrated before this prefetch.
    <HydrateClient>
      {/* Navbar is h-16 plus a 1px border; the footer follows below this block. */}
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
        <Suspense
          fallback={<Skeleton className="min-h-0 flex-1 rounded-none" />}
        >
          <MapSectorsProvider sectors={toDisplaySectors(sectors)}>
            <ArtisanMapExplorer shops={shops} categoryTree={categoryTree} />
          </MapSectorsProvider>
        </Suspense>
      </div>
    </HydrateClient>
  );
}
