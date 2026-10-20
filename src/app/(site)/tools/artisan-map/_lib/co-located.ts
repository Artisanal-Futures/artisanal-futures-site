import type { MapShop } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Exact (storefront) shops closer than this to a group's first shop share one
 * pin. Wide enough to catch the same building geocoded a metre or two apart
 * ("Suite 2" vs "Suite 3"), narrow enough to never merge neighbouring stores.
 */
export const CO_LOCATED_THRESHOLD_METERS = 15;

const METERS_PER_DEGREE = 111_320;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Coords = { lat: number; lng: number };

/** Equirectangular distance in metres; accurate enough at building scale. */
function distanceMeters(a: Coords, b: Coords) {
  const meanLat = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const dx = (b.lng - a.lng) * Math.cos(meanLat) * METERS_PER_DEGREE;
  const dy = (b.lat - a.lat) * METERS_PER_DEGREE;
  return Math.hypot(dx, dy);
}

function hasCoords(shop: MapShop): shop is MapShop & { location: Coords } {
  return (
    shop.location !== null &&
    Number.isFinite(shop.location.lat) &&
    Number.isFinite(shop.location.lng)
  );
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

/**
 * Maps every shop id to the shops that share its map pin, in input order.
 *
 * Only `exact` shops with a location are grouped (greedily, against the first
 * shop of each group). Approximate pins are deliberately jittered apart for
 * privacy, and unlocated shops have no pin, so each of those is a group of
 * one. Every member of a group maps to the same array instance.
 */
export function groupCoLocatedShops(shops: MapShop[]): Map<string, MapShop[]> {
  const byShopId = new Map<string, MapShop[]>();
  const exactGroups: Array<MapShop[]> = [];

  for (const shop of shops) {
    if (shop.precision === "exact" && hasCoords(shop)) {
      const group = exactGroups.find((g) => {
        const first = g[0]!;
        return (
          hasCoords(first) &&
          distanceMeters(first.location, shop.location) <=
            CO_LOCATED_THRESHOLD_METERS
        );
      });
      if (group) {
        group.push(shop);
        byShopId.set(shop.id, group);
        continue;
      }
      const created = [shop];
      exactGroups.push(created);
      byShopId.set(shop.id, created);
      continue;
    }
    byShopId.set(shop.id, [shop]);
  }

  return byShopId;
}
