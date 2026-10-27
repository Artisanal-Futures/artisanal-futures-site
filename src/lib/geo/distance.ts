/**
 * Pure geo helpers shared by the Artisan Map (client) and server code such as
 * the Shop Profile API's network ranking. No imports, so both sides can use it.
 */

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_MILES = 3958.8;

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
