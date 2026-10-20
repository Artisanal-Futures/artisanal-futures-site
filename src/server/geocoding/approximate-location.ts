/**
 * Pure helpers for the public Artisan Map. No database imports.
 *
 * Home-based and area-only shops are geocoded from zip/city/state only, so
 * many shops in one ZIP share the exact same centroid. Before such a
 * coordinate is sent to the public we nudge it by a deterministic, per-shop
 * offset (0.4-1.2 km) so that (a) the pin never sits on a precise point and
 * (b) shops sharing a ZIP don't stack on top of each other. Only a storefront
 * geocoded from its street is sent unshifted (`roundLocation`).
 */

export type MapShopLocation = {
  id: string;
  slug: string | null;
  name: string;
  ownerName: string;
  logoPhoto: string | null;
  ownerPhoto: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  attributeTags: string[];
  locality: string | null;
  location: { lat: number; lng: number } | null;
  /**
   * "exact" only for a STOREFRONT geocoded from its street; everything else
   * is an offset locality centroid.
   */
  precision: "exact" | "approximate";
  /** Street line, only for an exact (storefront) pin. */
  streetAddress?: string | null;
};

/** Trim a string; empty/whitespace-only/nullish becomes null. */
export function blankToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** "City, ST", either part alone, or null. */
export function formatLocality(
  city: string | null | undefined,
  state: string | null | undefined,
): string | null {
  const parts = [blankToNull(city), blankToNull(state)].filter(
    (part): part is string => part !== null,
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

const METERS_PER_DEGREE_LAT = 111_320;
const MIN_OFFSET_METERS = 400;
const OFFSET_RANGE_METERS = 800;

/** FNV-1a 32-bit hash with an optional salt so we can derive independent values. */
function fnv1a(input: string, salt: number): number {
  let hash = (0x811c9dc5 ^ salt) >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // Final avalanche (murmur3 fmix32) so similar ids don't yield similar values.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  hash ^= hash >>> 16;
  return hash >>> 0;
}

function unitFloat(input: string, salt: number): number {
  return fnv1a(input, salt) / 0x1_0000_0000;
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

/** An exact (storefront) pin, rounded to 5 decimals (~1 m). */
export function roundLocation(
  lat: number,
  lng: number,
): { lat: number; lng: number } {
  return { lat: round5(lat), lng: round5(lng) };
}

/**
 * Deterministically displace a coordinate by 0.4-1.2 km in a shop-specific
 * direction. Stable across calls for the same shopId.
 */
export function offsetLocation(
  shopId: string,
  lat: number,
  lng: number,
): { lat: number; lng: number } {
  const distance = MIN_OFFSET_METERS + unitFloat(shopId, 1) * OFFSET_RANGE_METERS;
  const bearing = unitFloat(shopId, 2) * 2 * Math.PI;

  const dLat = (distance * Math.cos(bearing)) / METERS_PER_DEGREE_LAT;
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
  const dLng =
    (distance * Math.sin(bearing)) / (METERS_PER_DEGREE_LAT * cosLat);

  return { lat: round5(lat + dLat), lng: round5(lng + dLng) };
}
