"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "~/components/ui/skeleton";

export type { ArtisanMapProps } from "./artisan-map";

/**
 * Client-only Artisan Map (MapLibre needs `window`/WebGL). Fills its parent,
 * so give the parent an explicit height.
 */
export const ArtisanMapLazy = dynamic(() => import("./artisan-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

export default ArtisanMapLazy;
