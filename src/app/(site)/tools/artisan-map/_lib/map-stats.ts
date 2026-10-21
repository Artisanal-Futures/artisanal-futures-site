import type { MapShop } from "./types";
import { STORE_ATTRIBUTES } from "~/lib/constants/store-attributes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MapStats = {
  artisans: number;
  cities: number;
  storefronts: number;
  products: number;
  services: number;
};

export type LatLng = { lat: number; lng: number };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EARTH_RADIUS_MILES = 3958.8;

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/**
 * Headline numbers for the map. `cities` counts distinct localities
 * (case-insensitive, shops without one are skipped) and `storefronts` the
 * shops pinned at their street address.
 */
export function computeMapStats(shops: MapShop[]): MapStats {
  const cities = new Set<string>();
  let storefronts = 0;
  let products = 0;
  let services = 0;

  for (const shop of shops) {
    const locality = shop.locality?.trim().toLowerCase();
    if (locality) cities.add(locality);
    if (shop.precision === "exact") storefronts += 1;
    products += shop.productCount;
    services += shop.serviceCount;
  }

  return {
    artisans: shops.length,
    cities: cities.size,
    storefronts,
    products,
    services,
  };
}

/**
 * Shop count per store attribute. Every `STORE_ATTRIBUTES` entry is present,
 * in its original order and zeros included; unknown tags are ignored.
 */
export function countAttributes(
  shops: Pick<MapShop, "attributeTags">[],
): Map<string, number> {
  const counts = new Map<string, number>(
    STORE_ATTRIBUTES.map((attribute) => [attribute, 0]),
  );

  for (const shop of shops) {
    // A repeated tag on one shop still counts that shop once.
    for (const tag of new Set(shop.attributeTags)) {
      const current = counts.get(tag);
      if (current !== undefined) counts.set(tag, current + 1);
    }
  }

  return counts;
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

/** Great-circle distance in miles (haversine). */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * "<1 mi", "8.2 mi", "23 mi". Approximate pins are offset on purpose, so
 * their distances get a "~" (except under a mile, which is already vague).
 */
export function formatDistance(miles: number, approximate: boolean): string {
  if (miles < 1) return "<1 mi";

  const tenths = Math.round(miles * 10) / 10;
  const text = tenths < 10 ? tenths.toFixed(1) : String(Math.round(miles));
  return `${approximate ? "~" : ""}${text} mi`;
}
