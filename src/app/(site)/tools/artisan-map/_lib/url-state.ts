import type { BoundaryLayerId } from "./boundaries";
import type { CollaborationTag } from "~/lib/constants/collaboration-tags";

import { parseBoundaryLayer } from "./boundaries";
import { parseCollabTags } from "./collab";
import { parseSectors } from "./sectors";

/**
 * The Artisan Map's shareable state lives in the query string. Everything is
 * parsed here, once, into a single `MapUrlState`; adding a param means adding
 * a field and a line in `parseMapUrlState`.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Every query param the map reads or writes. */
export type MapUrlParam =
  | "q"
  | "attributes"
  | "visit"
  | "sectors"
  | "collab"
  | "offers"
  | "needs"
  | "shop"
  | "lng"
  | "lat"
  | "zoom"
  | "layer";

/** `value` sets the param, `null` (or "") removes it. */
export type MapUrlUpdates = Partial<Record<MapUrlParam, string | null>>;

export type MapUrlState = {
  /** Free-text search, untrimmed. */
  query: string;
  /** Store attributes; a shop needs any one of them. */
  attributes: string[];
  /** "Only storefronts you can visit" (`visit=1`). */
  inPerson: boolean;
  /** Selected sectors; `[]` means all. */
  sectors: string[];
  /** "Open to collaborate" only (`collab=1`). */
  collab: boolean;
  /** Can offer any of these (`offers=slug,…`). */
  offers: CollaborationTag[];
  /** Looking for any of these (`needs=slug,…`). */
  needs: CollaborationTag[];
  /** Selected shop id. */
  shop: string | null;
  /** Camera from `lng`/`lat`/`zoom`; null unless all three are valid. */
  viewport: MapViewport | null;
  /** Detroit boundary overlay (`layer=council|neighborhoods|zip`). */
  layer: BoundaryLayerId | null;
};

/** A map camera, in react-map-gl's `initialViewState` shape. */
export type MapViewport = {
  longitude: number;
  latitude: number;
  zoom: number;
};

/** The subset of `URLSearchParams` we read, so tests can pass a plain one. */
type SearchParamsLike = Pick<URLSearchParams, "get">;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The filter params "Clear filters" resets. The selection, the camera
 * (`lng`/`lat`/`zoom`) and the boundary `layer` are deliberately not filters
 * and survive it.
 */
export const FILTER_PARAMS = [
  "q",
  "attributes",
  "visit",
  "sectors",
  "collab",
  "offers",
  "needs",
] as const satisfies readonly MapUrlParam[];

/** Valid camera ranges. Latitude stops where Web Mercator does. */
const LNG_RANGE = [-180, 180] as const;
const LAT_RANGE = [-85.0511, 85.0511] as const;
const ZOOM_RANGE = [0, 22] as const;

/** Decimal places written to the URL: ~11 m of position, plenty for zoom. */
const LNG_LAT_DECIMALS = 4;
const ZOOM_DECIMALS = 2;

// ---------------------------------------------------------------------------
// Parse / write
// ---------------------------------------------------------------------------

/** Splits a comma list, dropping blanks and duplicates. */
export function parseList(param: string | null | undefined): string[] {
  if (!param) return [];
  return [
    ...new Set(
      param
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

/** A plain decimal (no hex, exponents or blanks) within `[min, max]`. */
function parseNumberIn(
  raw: string | null,
  [min, max]: readonly [number, number],
): number | null {
  if (!raw || !/^-?\d+(\.\d+)?$/.test(raw.trim())) return null;
  const value = Number(raw);
  return value >= min && value <= max ? value : null;
}

/**
 * Reads the camera from `lng`, `lat` and `zoom`. All three are required and
 * range-checked; anything missing or out of range gives null (auto-fit).
 */
export function parseViewport(sp: SearchParamsLike): MapViewport | null {
  const longitude = parseNumberIn(sp.get("lng"), LNG_RANGE);
  const latitude = parseNumberIn(sp.get("lat"), LAT_RANGE);
  const zoom = parseNumberIn(sp.get("zoom"), ZOOM_RANGE);
  if (longitude === null || latitude === null || zoom === null) return null;
  return { longitude, latitude, zoom };
}

/** Rounds to `decimals` places, without trailing zeros ("12" not "12.00"). */
const round = (value: number, decimals: number) =>
  String(Number(value.toFixed(decimals)));

/** Into [-180, 180): panning past the antimeridian can unwrap the centre. */
const wrapLng = (lng: number) => ((((lng + 180) % 360) + 360) % 360) - 180;

/** Updates that write the camera, rounded to keep the URL short. */
export function viewportUpdates({
  longitude,
  latitude,
  zoom,
}: MapViewport): MapUrlUpdates {
  return {
    lng: round(wrapLng(longitude), LNG_LAT_DECIMALS),
    lat: round(latitude, LNG_LAT_DECIMALS),
    zoom: round(zoom, ZOOM_DECIMALS),
  };
}

export function parseMapUrlState(
  sp: SearchParamsLike,
  sectorSlugs: readonly string[],
): MapUrlState {
  const shop = sp.get("shop");
  return {
    query: sp.get("q") ?? "",
    attributes: parseList(sp.get("attributes")),
    inPerson: sp.get("visit") === "1",
    sectors: parseSectors(sp.get("sectors"), sectorSlugs),
    collab: sp.get("collab") === "1",
    offers: parseCollabTags(sp.get("offers")),
    needs: parseCollabTags(sp.get("needs")),
    shop: shop?.trim() ? shop : null,
    viewport: parseViewport(sp),
    layer: parseBoundaryLayer(sp.get("layer")),
  };
}

/** Updates that remove every filter param (see `FILTER_PARAMS`). */
export function clearFilterUpdates(): MapUrlUpdates {
  return Object.fromEntries(FILTER_PARAMS.map((key) => [key, null]));
}

/**
 * Applies `updates` to an existing query string and returns the new one
 * (without "?"). Params not mentioned in `updates` are kept as they are.
 */
export function applyUrlUpdates(search: string, updates: MapUrlUpdates) {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(updates)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params.toString();
}
