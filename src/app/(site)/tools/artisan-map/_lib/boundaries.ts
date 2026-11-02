/**
 * Detroit civic boundary overlays for the Artisan Map (`?layer=`). Each layer
 * is a static, pre-simplified GeoJSON file in `public/map/boundaries/` (see
 * the README there), fetched only while that layer is switched on.
 *
 * Every file holds polygons with a single `label` property, plus Point
 * features (same `label`) placed inside each polygon for its text label.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const BOUNDARY_LAYER_IDS = ["council", "neighborhoods", "zip"] as const;

export type BoundaryLayerId = (typeof BOUNDARY_LAYER_IDS)[number];

/** `[[west, south], [east, north]]`, as `fitBounds` takes it. */
export type LngLatBoundsTuple = [[number, number], [number, number]];

export type BoundaryLayerConfig = {
  id: BoundaryLayerId;
  /** Radio label in the layers menu. */
  label: string;
  /** Static file under `public/`. Versioned so a new cut busts caches. */
  url: string;
  /** Who publishes the data; shown in the map attribution while active. */
  source: { name: string; url: string };
  /** Licence or terms of the source data. */
  license: string;
  /** Labels appear from this zoom, so small areas don't crowd the map. */
  labelMinZoom: number;
  /** Outline dash pattern (line widths), or undefined for a solid line. */
  dash?: number[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DETROIT_OPEN_DATA = {
  name: "City of Detroit Open Data",
  url: "https://data.detroitmi.gov/",
};

export const BOUNDARY_LAYERS: Record<BoundaryLayerId, BoundaryLayerConfig> = {
  council: {
    id: "council",
    label: "Council districts",
    url: "/map/boundaries/detroit-council-districts.v1.geojson",
    source: DETROIT_OPEN_DATA,
    license: "City of Detroit Open Data terms",
    labelMinZoom: 9,
  },
  neighborhoods: {
    id: "neighborhoods",
    label: "Neighborhoods",
    url: "/map/boundaries/detroit-neighborhoods.v1.geojson",
    source: DETROIT_OPEN_DATA,
    license: "City of Detroit Open Data terms",
    labelMinZoom: 12,
  },
  zip: {
    id: "zip",
    label: "ZIP codes",
    url: "/map/boundaries/detroit-zip-codes.v1.geojson",
    source: {
      name: "U.S. Census Bureau TIGER/Line ZCTAs",
      url: "https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html",
    },
    license: "Public domain (U.S. Government work)",
    labelMinZoom: 11,
    dash: [3, 2],
  },
};

/** The City of Detroit's extent, padded slightly. */
export const DETROIT_BOUNDS: LngLatBoundsTuple = [
  [-83.2877, 42.2551],
  [-82.9105, 42.4502],
];

/** Below this zoom Detroit is a speck, so turning a layer on zooms to it. */
const DETROIT_MIN_ZOOM = 9;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const isBoundaryLayer = (value: unknown): value is BoundaryLayerId =>
  typeof value === "string" &&
  (BOUNDARY_LAYER_IDS as readonly string[]).includes(value);

/** Reads `?layer=`; anything unknown means no overlay. */
export function parseBoundaryLayer(
  param: string | null | undefined,
): BoundaryLayerId | null {
  const value = param?.trim();
  return isBoundaryLayer(value) ? value : null;
}

/** Whether two `[[w, s], [e, n]]` boxes overlap (touching counts). */
function boundsIntersect(a: LngLatBoundsTuple, b: LngLatBoundsTuple) {
  return (
    a[0][0] <= b[1][0] &&
    a[1][0] >= b[0][0] &&
    a[0][1] <= b[1][1] &&
    a[1][1] >= b[0][1]
  );
}

/**
 * True when the camera is "off Detroit": the city is out of view, or the map
 * is zoomed out so far that its boundaries would be unreadable. Switching a
 * layer on then fits the map to `DETROIT_BOUNDS`.
 */
export function isOffDetroit(view: LngLatBoundsTuple, zoom: number) {
  return zoom < DETROIT_MIN_ZOOM || !boundsIntersect(view, DETROIT_BOUNDS);
}
