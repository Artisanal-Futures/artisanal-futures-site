"use client";

import type { ExpressionSpecification, FilterSpecification } from "maplibre-gl";
import type { LayerProps } from "react-map-gl/maplibre";
import { useEffect, useMemo, useState } from "react";
import { Layer, Source } from "react-map-gl/maplibre";

import type { BoundaryLayerId } from "../_lib/boundaries";
import type { MapTheme } from "./map-style";

import { BOUNDARY_LAYERS } from "../_lib/boundaries";
import { basemapLabelColors, MAP_FONT_REGULAR } from "./map-style";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export type BoundaryData = {
  geojson: GeoJSON.FeatureCollection;
  /** Whether the file carries its own label Points (see the README). */
  hasLabelPoints: boolean;
};

export type BoundaryStatus = "idle" | "loading" | "ready" | "error";

type BoundaryState =
  | { layer: BoundaryLayerId; status: "ready"; data: BoundaryData }
  | { layer: BoundaryLayerId; status: "error"; data: null };

/**
 * One request per file per page load. A failed request is forgotten, so
 * picking the layer again retries it; nothing retries on its own.
 */
const requests = new Map<string, Promise<BoundaryData>>();

function isFeatureCollection(
  value: unknown,
): value is GeoJSON.FeatureCollection {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "FeatureCollection" &&
    Array.isArray((value as { features?: unknown }).features)
  );
}

function loadBoundary(url: string): Promise<BoundaryData> {
  let request = requests.get(url);
  if (!request) {
    request = fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
        const json: unknown = await res.json();
        if (!isFeatureCollection(json)) {
          throw new Error(`${url}: not a GeoJSON FeatureCollection`);
        }
        return {
          geojson: json,
          hasLabelPoints: json.features.some(
            (f) => f.geometry?.type === "Point",
          ),
        };
      })
      .catch((err: unknown) => {
        requests.delete(url);
        throw err;
      });
    requests.set(url, request);
  }
  return request;
}

/**
 * Fetches the active layer's GeoJSON (lazily: nothing loads until a layer is
 * picked). A missing or broken file reports `"error"` so the layers menu can
 * say so; the map itself carries on without the overlay.
 */
export function useBoundaryData(layer: BoundaryLayerId | null): {
  status: BoundaryStatus;
  data: BoundaryData | null;
} {
  const [state, setState] = useState<BoundaryState | null>(null);

  useEffect(() => {
    if (!layer) return;
    let cancelled = false;
    loadBoundary(BOUNDARY_LAYERS[layer].url)
      .then((data) => {
        if (!cancelled) setState({ layer, status: "ready", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.warn("[artisan-map] Boundary layer unavailable", err);
        setState({ layer, status: "error", data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [layer]);

  if (!layer) return { status: "idle", data: null };
  // A result for a previous layer means this one is still on its way.
  if (state?.layer !== layer) return { status: "loading", data: null };
  return { status: state.status, data: state.data };
}

// ---------------------------------------------------------------------------
// Layers
// ---------------------------------------------------------------------------

const SOURCE_ID_PREFIX = "artisan-boundary";

/** Neutral outlines, so they never compete with the sector-coloured pins. */
const LINE_COLORS: Record<MapTheme, string> = {
  light: "#6b5a48",
  dark: "#c9bca9",
};

const IS_AREA: FilterSpecification = [
  "in",
  ["geometry-type"],
  ["literal", ["Polygon", "MultiPolygon"]],
];
const IS_POINT: FilterSpecification = ["==", ["geometry-type"], "Point"];

function buildBoundaryLayers(
  layer: BoundaryLayerId,
  theme: MapTheme,
  hasLabelPoints: boolean,
) {
  const config = BOUNDARY_LAYERS[layer];
  const prefix = `${SOURCE_ID_PREFIX}-${layer}`;
  const line = LINE_COLORS[theme];
  const label = basemapLabelColors(theme);

  const fill: LayerProps = {
    id: `${prefix}-fill`,
    type: "fill",
    filter: IS_AREA,
    paint: { "fill-color": line, "fill-opacity": 0.04 },
  };

  const lineWidth: ExpressionSpecification = [
    "interpolate",
    ["linear"],
    ["zoom"],
    9,
    0.75,
    14,
    1.75,
  ];

  const outline: LayerProps = {
    id: `${prefix}-line`,
    type: "line",
    filter: IS_AREA,
    layout: { "line-join": "round" },
    paint: {
      "line-color": line,
      "line-opacity": 0.7,
      "line-width": lineWidth,
      ...(config.dash ? { "line-dasharray": config.dash } : {}),
    },
  };

  // Prefer the file's inner label Points; without them, MapLibre places one
  // label per polygon itself.
  const labels: LayerProps = {
    id: `${prefix}-label`,
    type: "symbol",
    minzoom: config.labelMinZoom,
    filter: hasLabelPoints ? IS_POINT : IS_AREA,
    layout: {
      "text-field": ["to-string", ["get", "label"]],
      "text-font": MAP_FONT_REGULAR,
      "text-size": ["interpolate", ["linear"], ["zoom"], 10, 11, 15, 13],
      "text-max-width": 8,
      "text-padding": 4,
    },
    paint: {
      "text-color": label.text,
      "text-halo-color": label.halo,
      "text-halo-width": 1.25,
    },
  };

  return { fill, outline, labels };
}

/**
 * Draws a boundary layer under every Artisan Map layer (`beforeId`), so pins
 * and their approximate-area rings stay on top. Mounted only while a layer is
 * active and loaded; its `attribution` joins the map's while it's mounted.
 */
export function BoundaryOverlay({
  layer,
  data,
  theme,
  beforeId,
}: {
  layer: BoundaryLayerId;
  data: BoundaryData;
  theme: MapTheme;
  /** Bottom-most Artisan Map layer; the overlay is drawn beneath it. */
  beforeId: string;
}) {
  const config = BOUNDARY_LAYERS[layer];
  const layers = useMemo(
    () => buildBoundaryLayers(layer, theme, data.hasLabelPoints),
    [layer, theme, data.hasLabelPoints],
  );

  return (
    <Source
      // A new source per layer: react-map-gl fixes a source's id (and reads
      // its attribution) on mount, and removes the old one asynchronously.
      key={layer}
      id={`${SOURCE_ID_PREFIX}-${layer}`}
      type="geojson"
      data={data.geojson}
      attribution={`${config.label}: <a href="${config.source.url}" target="_blank" rel="noopener noreferrer">${config.source.name}</a>`}
    >
      <Layer {...layers.fill} beforeId={beforeId} />
      <Layer {...layers.outline} beforeId={beforeId} />
      <Layer {...layers.labels} beforeId={beforeId} />
    </Source>
  );
}
