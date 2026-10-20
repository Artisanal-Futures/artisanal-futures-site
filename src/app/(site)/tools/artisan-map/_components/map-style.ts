import type {
  ExpressionSpecification,
  LayerSpecification,
  StyleSpecification,
} from "maplibre-gl";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Themed basemap for the Artisan Map.
 *
 * We fetch OpenFreeMap's "positron" style once, then hand out a deep-cloned
 * copy recoloured to the site's earthy palette (warm cream land, sage parks,
 * blue-sage water) for light mode, or a warm charcoal variant for dark mode.
 */

export const OPENFREEMAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/positron";
export const OPENFREEMAP_GLYPHS_URL =
  "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

/** Fonts that exist on the OpenFreeMap glyph server (verified against positron). */
export const MAP_FONT_BOLD = ["Noto Sans Bold"];
export const MAP_FONT_REGULAR = ["Noto Sans Regular"];

export type MapTheme = "light" | "dark";

// ---------------------------------------------------------------------------
// Brand colours for pins / clusters (layered on top of the basemap)
// ---------------------------------------------------------------------------

export type MapBrandColors = {
  /** Default pin fill (sage green). */
  pin: string;
  /** Pin fill while hovered (from the list or the map). */
  pinHover: string;
  /** Pin fill for the selected shop (terracotta). */
  pinSelected: string;
  /** Pin outline + centre dot. */
  pinStroke: string;
  /** Cluster bubble fill. */
  cluster: string;
  /** Cluster bubble ring. */
  clusterStroke: string;
  /** Cluster count text. */
  clusterText: string;
  /** "You are here" dot. */
  userLocation: string;
};

export const MAP_BRAND_COLORS: Record<MapTheme, MapBrandColors> = {
  light: {
    pin: "#3f7a52",
    pinHover: "#2f6040",
    pinSelected: "#c2643c",
    pinStroke: "#fffaf0",
    cluster: "#3f7a52",
    clusterStroke: "#f6f1e7",
    clusterText: "#fffaf0",
    userLocation: "#2f6f9f",
  },
  dark: {
    pin: "#6fae80",
    pinHover: "#8cc79b",
    pinSelected: "#e08a5f",
    pinStroke: "#1f1d1a",
    cluster: "#4f8f63",
    clusterStroke: "#1f1d1a",
    clusterText: "#f6f1e7",
    userLocation: "#7fb6dd",
  },
};

/** Light-mode defaults, for consumers that only need a single value. */
export const PIN_COLOR = MAP_BRAND_COLORS.light.pin;
export const PIN_HOVER = MAP_BRAND_COLORS.light.pinHover;
export const PIN_SELECTED = MAP_BRAND_COLORS.light.pinSelected;
export const CLUSTER_COLOR = MAP_BRAND_COLORS.light.cluster;
export const CLUSTER_TEXT_COLOR = MAP_BRAND_COLORS.light.clusterText;
export const PIN_COLOR_DARK = MAP_BRAND_COLORS.dark.pin;
export const PIN_SELECTED_DARK = MAP_BRAND_COLORS.dark.pinSelected;
export const CLUSTER_COLOR_DARK = MAP_BRAND_COLORS.dark.cluster;

// ---------------------------------------------------------------------------
// Basemap palettes
// ---------------------------------------------------------------------------

type BasemapPalette = {
  land: string;
  residential: string;
  park: string;
  wood: string;
  ice: string;
  water: string;
  waterway: string;
  building: string;
  buildingOutline: string;
  aeroway: string;
  aerowayLine: string;
  roadCasing: string;
  motorway: string;
  roadMajor: string;
  roadMinor: string;
  roadPath: string;
  roadSubtle: string;
  rail: string;
  railDash: string;
  boundary: string;
  textPlace: string;
  textState: string;
  textCountry: string;
  textMuted: string;
  textRoad: string;
  textWater: string;
  halo: string;
};

const BASEMAP_PALETTES: Record<MapTheme, BasemapPalette> = {
  light: {
    land: "#f6f1e7",
    residential: "#f1eadd",
    park: "#dfe6d3",
    wood: "#e3e8d6",
    ice: "#fbf8f2",
    water: "#c9d8d6",
    waterway: "#b9cdca",
    building: "#ece4d6",
    buildingOutline: "#e0d6c5",
    aeroway: "#fbf8f2",
    aerowayLine: "#e9e1d3",
    roadCasing: "#e3d9c8",
    motorway: "#ffffff",
    roadMajor: "#ffffff",
    roadMinor: "#ece4d6",
    roadPath: "#ece4d6",
    roadSubtle: "rgba(214, 203, 186, 0.6)",
    rail: "#e2d9ca",
    railDash: "#f6f1e7",
    boundary: "#c4b6a3",
    textPlace: "#4f453b",
    textState: "#8a7d6e",
    textCountry: "#5c5146",
    textMuted: "#6b5f52",
    textRoad: "#7d7062",
    textWater: "#56746f",
    halo: "rgba(246, 241, 231, 0.9)",
  },
  dark: {
    land: "#1f1d1a",
    residential: "#23211d",
    park: "#262c22",
    wood: "#242920",
    ice: "#2a2825",
    water: "#16272a",
    waterway: "#1d3236",
    building: "#2a2723",
    buildingOutline: "#322e29",
    aeroway: "#2c2924",
    aerowayLine: "#302c27",
    roadCasing: "#2c2924",
    motorway: "#423c34",
    roadMajor: "#3a352f",
    roadMinor: "#302c27",
    roadPath: "#2c2924",
    roadSubtle: "rgba(70, 63, 55, 0.6)",
    rail: "#34302a",
    railDash: "#1f1d1a",
    boundary: "#4f483f",
    textPlace: "#e6ddcf",
    textState: "#9c9081",
    textCountry: "#d2c8ba",
    textMuted: "#b3a796",
    textRoad: "#a39887",
    textWater: "#7fa3a0",
    halo: "rgba(31, 29, 26, 0.9)",
  },
};

// ---------------------------------------------------------------------------
// Recolouring
// ---------------------------------------------------------------------------

type Paint = Record<string, unknown>;

function setPaint(layer: LayerSpecification, values: Paint) {
  const paint = ((layer as { paint?: Paint }).paint ??= {});
  Object.assign(paint, values);
}

function sourceLayerOf(layer: LayerSpecification): string | undefined {
  return "source-layer" in layer ? layer["source-layer"] : undefined;
}

function hasTextField(layer: LayerSpecification): boolean {
  return (
    layer.type === "symbol" &&
    !!(layer.layout as Record<string, unknown> | undefined)?.["text-field"]
  );
}

function hasIcon(layer: LayerSpecification): boolean {
  return (
    layer.type === "symbol" &&
    !!(layer.layout as Record<string, unknown> | undefined)?.["icon-image"]
  );
}

function motorwayColor(p: BasemapPalette): ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    5.8,
    p.roadSubtle,
    6,
    p.motorway,
  ];
}

function recolorTransportLine(layer: LayerSpecification, p: BasemapPalette) {
  const id = layer.id;
  if (id.includes("pier")) {
    setPaint(layer, { "line-color": p.land });
  } else if (id.includes("rail")) {
    setPaint(layer, {
      "line-color": id.includes("dash") ? p.railDash : p.rail,
    });
  } else if (id.includes("casing")) {
    setPaint(layer, { "line-color": p.roadCasing });
  } else if (id.includes("subtle")) {
    setPaint(layer, { "line-color": p.roadSubtle });
  } else if (id.includes("path")) {
    setPaint(layer, { "line-color": p.roadPath });
  } else if (id.includes("minor") || id.startsWith("tunnel")) {
    setPaint(layer, { "line-color": p.roadMinor });
  } else if (id.includes("motorway")) {
    setPaint(layer, { "line-color": motorwayColor(p) });
  } else {
    setPaint(layer, { "line-color": p.roadMajor });
  }
}

function recolorSymbol(layer: LayerSpecification, p: BasemapPalette) {
  // Leave road shields alone: their text sits on a sprite and must stay dark.
  if (!hasTextField(layer) || (hasIcon(layer) && layer.id.includes("shield"))) {
    return;
  }
  const sl = sourceLayerOf(layer);
  const id = layer.id;
  let color = p.textMuted;
  if (sl === "water_name" || sl === "waterway") color = p.textWater;
  else if (sl === "transportation_name") color = p.textRoad;
  else if (sl === "place") {
    if (id.includes("state")) color = p.textState;
    else if (id.includes("country")) color = p.textCountry;
    else if (id.includes("other")) color = p.textMuted;
    else color = p.textPlace;
  }
  setPaint(layer, { "text-color": color, "text-halo-color": p.halo });
}

function recolorLayer(layer: LayerSpecification, p: BasemapPalette) {
  const sl = sourceLayerOf(layer);
  const id = layer.id;

  if (layer.type === "background") {
    setPaint(layer, { "background-color": p.land });
    return;
  }
  if (layer.type === "symbol") {
    recolorSymbol(layer, p);
    return;
  }

  switch (sl) {
    case "park":
      if (layer.type === "fill") setPaint(layer, { "fill-color": p.park });
      return;
    case "water":
      if (layer.type === "fill") setPaint(layer, { "fill-color": p.water });
      return;
    case "waterway":
      if (layer.type === "line") setPaint(layer, { "line-color": p.waterway });
      return;
    case "landcover":
      if (layer.type === "fill") {
        const color =
          id.includes("ice") || id.includes("glacier")
            ? p.ice
            : id.includes("grass") || id.includes("park")
              ? p.park
              : p.wood;
        setPaint(layer, { "fill-color": color });
      }
      return;
    case "landuse":
      if (layer.type === "fill")
        setPaint(layer, { "fill-color": p.residential });
      return;
    case "building":
      if (layer.type === "fill") {
        setPaint(layer, {
          "fill-color": p.building,
          "fill-outline-color": p.buildingOutline,
        });
      }
      return;
    case "aeroway":
      if (layer.type === "fill") setPaint(layer, { "fill-color": p.aeroway });
      else if (layer.type === "line") {
        setPaint(layer, {
          "line-color":
            id.includes("casing") || id.includes("taxiway")
              ? p.aerowayLine
              : p.aeroway,
        });
      }
      return;
    case "transportation":
      if (layer.type === "line") recolorTransportLine(layer, p);
      else if (layer.type === "fill") setPaint(layer, { "fill-color": p.land });
      return;
    case "boundary":
      if (layer.type === "line") setPaint(layer, { "line-color": p.boundary });
      return;
    default:
      return;
  }
}

export function recolorStyle(
  base: StyleSpecification,
  theme: MapTheme,
): StyleSpecification {
  const style = structuredClone(base);
  const palette = BASEMAP_PALETTES[theme];
  for (const layer of style.layers) recolorLayer(layer, palette);
  style.glyphs ??= OPENFREEMAP_GLYPHS_URL;
  return style;
}

/** Minimal valid style used if the OpenFreeMap style JSON can't be fetched. */
export function fallbackStyle(theme: MapTheme): StyleSpecification {
  return {
    version: 8,
    glyphs: OPENFREEMAP_GLYPHS_URL,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": BASEMAP_PALETTES[theme].land },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Fetch + cache
// ---------------------------------------------------------------------------

let baseStylePromise: Promise<StyleSpecification> | null = null;

export function loadBaseStyle(): Promise<StyleSpecification> {
  baseStylePromise ??= fetch(OPENFREEMAP_STYLE_URL)
    .then(async (res) => {
      if (!res.ok)
        throw new Error(`Basemap style request failed: ${res.status}`);
      const json = (await res.json()) as StyleSpecification;
      if (json?.version !== 8 || !Array.isArray(json.layers)) {
        throw new Error("Basemap style is not a valid v8 style");
      }
      return json;
    })
    .catch((err: unknown) => {
      // Allow a retry on the next mount rather than caching the failure.
      baseStylePromise = null;
      throw err;
    });
  return baseStylePromise;
}

const themedCache = new WeakMap<
  StyleSpecification,
  Partial<Record<MapTheme, StyleSpecification>>
>();

function getThemedStyle(base: StyleSpecification, theme: MapTheme) {
  let entry = themedCache.get(base);
  if (!entry) {
    entry = {};
    themedCache.set(base, entry);
  }
  return (entry[theme] ??= recolorStyle(base, theme));
}

/** Resolves next-themes' resolvedTheme to the two map themes. */
export function useMapTheme(): MapTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? "dark" : "light";
}

type BaseState =
  | { status: "loading" }
  | { status: "ready"; base: StyleSpecification }
  | { status: "error" };

/**
 * Returns the recoloured basemap for the current theme, or `null` while the
 * base style is still loading. Falls back to a background-only style on error
 * so the map (and its pins) still render.
 */
export function useArtisanMapStyle(): StyleSpecification | null {
  const theme = useMapTheme();
  const [state, setState] = useState<BaseState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadBaseStyle()
      .then((base) => {
        if (!cancelled) setState({ status: "ready", base });
      })
      .catch((err: unknown) => {
        console.error("[artisan-map] Falling back to minimal basemap", err);
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    if (state.status === "loading") return null;
    if (state.status === "error") return fallbackStyle(theme);
    return getThemedStyle(state.base, theme);
  }, [state, theme]);
}
