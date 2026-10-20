/**
 * Approximate shop geocoding for the Artisan Map.
 *
 * PRIVACY: many artisans work from home, so a shop's pin must never point at
 * a street address. Everything in this module works from the LOCALITY fields
 * only — zip, city, state, country. The street-level ShopAddress fields
 * (`address`, `street`, `additional`) are deliberately absent from
 * `GeocodeInput` and are never selected from the database here, so they
 * cannot reach the geocoder by accident.
 *
 * Geocoding uses OpenStreetMap Nominatim's structured search. Its usage
 * policy allows at most one request per second, so every request goes
 * through a module-level throttle (see `waitForRequestSlot`).
 */

import type { PrismaClient } from "../../../generated/prisma";

export type GeocodeInput = {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
};

export type GeocodeResult = { lat: number; lng: number };

export type SyncShopCoordinatesResult =
  | "unchanged"
  | "located"
  | "not_found"
  | "no_address"
  | "cleared"
  /** The geocoder could not be reached (network error, timeout, HTTP error). */
  | "failed";

type GeocodeDb = Pick<PrismaClient, "shopAddress">;

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ArtisanalFutures/1.0 (+https://artisanalfutures.org)";
const REQUEST_TIMEOUT_MS = 5_000;

/** Nominatim policy is max 1 req/sec; leave a little headroom. */
export const NOMINATIM_MIN_INTERVAL_MS = 1_100;

/** The site is US-only for now, so a missing country means the US. */
const DEFAULT_COUNTRY = "us";

/** Every spelling of "United States" we have seen in stored rows. */
const US_ALIASES = new Set([
  "us",
  "usa",
  "u.s.",
  "u.s.a.",
  "united states",
  "united states of america",
]);

type NormalizedLocality = {
  zip: string | null;
  city: string | null;
  state: string | null;
  country: string;
};

/** Trim, collapse inner whitespace, lowercase; blank → null. */
function clean(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ").toLowerCase();
  return cleaned === "" ? null : cleaned;
}

function normalizeLocality(input: GeocodeInput): NormalizedLocality {
  const rawCountry = clean(input.country);
  const country =
    rawCountry === null || US_ALIASES.has(rawCountry)
      ? DEFAULT_COUNTRY
      : rawCountry;

  let zip = clean(input.zip);
  if (zip && country === "us") {
    // ZIP+4 can narrow down to a single block face — only ever use the
    // 5-digit ZIP for US addresses.
    const fiveDigit = /^(\d{5})(?:[-\s]?\d{4})?$/.exec(zip);
    if (fiveDigit) zip = fiveDigit[1] ?? zip;
  }

  return {
    zip,
    city: clean(input.city),
    state: clean(input.state),
    country,
  };
}

/**
 * Stable, normalized cache key for a locality, e.g.
 * `zip=48201|city=detroit|state=mi|country=us`. Returns null when there is
 * not enough to geocode (neither zip nor city).
 */
export function buildGeocodeQuery(input: GeocodeInput): string | null {
  const locality = normalizeLocality(input);
  if (!locality.zip && !locality.city) return null;

  return [
    `zip=${locality.zip ?? ""}`,
    `city=${locality.city ?? ""}`,
    `state=${locality.state ?? ""}`,
    `country=${locality.country}`,
  ].join("|");
}

// ---------------------------------------------------------------------------
// Nominatim
// ---------------------------------------------------------------------------

let nextRequestSlot = 0;

/**
 * Reserve the next request slot synchronously (so concurrent callers queue up
 * in order), then wait until it arrives. Guarantees at least
 * NOMINATIM_MIN_INTERVAL_MS between request starts within this process.
 */
async function waitForRequestSlot(): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextRequestSlot);
  nextRequestSlot = slot + NOMINATIM_MIN_INTERVAL_MS;
  const wait = slot - now;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

type LookupOutcome =
  | { status: "found"; lat: number; lng: number }
  | { status: "not_found" }
  | { status: "error" };

async function nominatimSearch(
  params: Record<string, string>,
): Promise<LookupOutcome> {
  await waitForRequestSlot();

  const url = new URL(NOMINATIM_SEARCH_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(`[geocode] Nominatim responded ${res.status}`);
      return { status: "error" };
    }

    const body: unknown = await res.json();
    if (!Array.isArray(body) || body.length === 0) {
      return { status: "not_found" };
    }

    const first = body[0] as { lat?: unknown; lon?: unknown } | undefined;
    const lat = Number(first?.lat);
    const lng = Number(first?.lon);
    if (
      typeof first?.lat !== "string" ||
      typeof first?.lon !== "string" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      return { status: "not_found" };
    }

    return { status: "found", lat, lng };
  } catch (error) {
    console.warn("[geocode] Nominatim request failed:", error);
    return { status: "error" };
  }
}

/**
 * Zip first (most precise locality we accept), then city/state. "error" only
 * when no attempt produced a definitive answer, so a transient outage is not
 * mistaken for an address that doesn't exist.
 */
async function lookupLocality(input: GeocodeInput): Promise<LookupOutcome> {
  const locality = normalizeLocality(input);
  if (!locality.zip && !locality.city) return { status: "not_found" };

  const countryParams: Record<string, string> =
    locality.country === "us"
      ? { country: "United States", countrycodes: "us" }
      : { country: locality.country };

  let sawError = false;

  if (locality.zip) {
    const byZip = await nominatimSearch({
      postalcode: locality.zip,
      ...countryParams,
    });
    if (byZip.status === "found") return byZip;
    if (byZip.status === "error") sawError = true;
  }

  if (locality.city) {
    const byCity = await nominatimSearch({
      city: locality.city,
      ...(locality.state ? { state: locality.state } : {}),
      ...countryParams,
    });
    if (byCity.status === "found") return byCity;
    if (byCity.status === "error") sawError = true;
  }

  return sawError ? { status: "error" } : { status: "not_found" };
}

/**
 * Approximate coordinates for a locality (zip, else city/state). Never
 * throws — returns null when not found or when the geocoder is unreachable.
 */
export async function geocodeLocality(
  input: GeocodeInput,
): Promise<GeocodeResult | null> {
  try {
    const outcome = await lookupLocality(input);
    return outcome.status === "found"
      ? { lat: outcome.lat, lng: outcome.lng }
      : null;
  } catch (error) {
    console.warn("[geocode] geocodeLocality failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Bring a shop's stored coordinates in line with its current locality.
 *
 * Skips the network entirely when the normalized query matches the one last
 * geocoded (unless `force`). `geocodeQuery` is stored on not_found too, so an
 * address Nominatim can't place isn't re-queried on every save. A network
 * failure stores nothing new for the query, so the next save or backfill
 * retries it.
 */
export async function syncShopCoordinates(
  db: GeocodeDb,
  shopId: string,
  opts: { force?: boolean } = {},
): Promise<SyncShopCoordinatesResult> {
  const row = await db.shopAddress.findUnique({
    where: { shopId },
    // Locality fields only — never select street-level fields here.
    select: {
      id: true,
      zip: true,
      city: true,
      state: true,
      country: true,
      latitude: true,
      longitude: true,
      geocodeQuery: true,
    },
  });

  if (!row) return "no_address";

  const query = buildGeocodeQuery(row);

  if (query === null) {
    if (
      row.latitude === null &&
      row.longitude === null &&
      row.geocodeQuery === null
    ) {
      return "no_address";
    }
    await db.shopAddress.update({
      where: { id: row.id },
      data: {
        latitude: null,
        longitude: null,
        geocodeQuery: null,
        geocodedAt: new Date(),
      },
    });
    return "cleared";
  }

  const queryChanged = query !== row.geocodeQuery;
  if (!queryChanged && !opts.force) return "unchanged";

  const outcome = await lookupLocality(row);

  if (outcome.status === "error") {
    // Keep coordinates that still describe this exact locality (a forced
    // re-run hitting an outage); drop stale ones from an old locality so the
    // map doesn't show the wrong place, and leave geocodeQuery null so the
    // next sync retries.
    if (queryChanged && (row.latitude !== null || row.longitude !== null)) {
      await db.shopAddress.update({
        where: { id: row.id },
        data: { latitude: null, longitude: null, geocodeQuery: null },
      });
    }
    return "failed";
  }

  const found = outcome.status === "found";
  await db.shopAddress.update({
    where: { id: row.id },
    data: {
      latitude: found ? outcome.lat : null,
      longitude: found ? outcome.lng : null,
      geocodeQuery: query,
      geocodedAt: new Date(),
    },
  });

  return found ? "located" : "not_found";
}
