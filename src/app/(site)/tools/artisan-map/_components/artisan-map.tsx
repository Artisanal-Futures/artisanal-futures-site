"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "./artisan-map.css";

import type {
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSource,
  Map as MaplibreMap,
  MapStyleImageMissingEvent,
  SymbolLayerSpecification,
} from "maplibre-gl";
import type { CSSProperties, ReactNode } from "react";
import type {
  LayerProps,
  MapLayerMouseEvent,
  MapRef,
  PopupProps,
} from "react-map-gl/maplibre";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Loader2, LocateFixed } from "lucide-react";
import MapGL, {
  AttributionControl,
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  useMap,
} from "react-map-gl/maplibre";
import { toast } from "sonner";

import type { MapShop } from "../_lib/types";
import type { MapBrandColors } from "./map-style";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

import { groupCoLocatedShops } from "../_lib/co-located";
import { MapLegend } from "./map-legend";
import {
  MAP_BRAND_COLORS,
  MAP_FONT_BOLD,
  useArtisanMapStyle,
  useMapTheme,
} from "./map-style";
import {
  createPinImage,
  PIN_IMAGE_ID,
  PIN_PIXEL_RATIO,
  PIN_TIP_INSET,
  PIN_VISUAL_HEIGHT,
} from "./pin-image";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * MapLibre v6 derives its worker URL from `import.meta.url`, which the bundler
 * rewrites, so point it at the worker file emitted as a static asset instead.
 */
const MAPLIBRE_WORKER_URL = new URL(
  "maplibre-gl/dist/maplibre-gl-worker.mjs",
  import.meta.url,
).toString();

export const US_CENTER = { longitude: -98.5, latitude: 39.8 } as const;
export const US_ZOOM = 3.5;

const SOURCE_ID = "artisan-shops";
const SELECTED_SOURCE_ID = "artisan-selected-shop";
const AREA_RING_LAYER_ID = "artisan-area-rings";
const CLUSTER_LAYER_ID = "artisan-clusters";
const CLUSTER_COUNT_LAYER_ID = "artisan-cluster-count";
const PIN_SHADOW_LAYER_ID = "artisan-pin-shadow";
const PIN_LAYER_ID = "artisan-pins";
const SELECTED_SHADOW_LAYER_ID = "artisan-selected-shadow";
const SELECTED_PIN_LAYER_ID = "artisan-selected-pin";
const PIN_BADGE_LAYER_ID = "artisan-pin-badge";
const PIN_BADGE_COUNT_LAYER_ID = "artisan-pin-badge-count";
const SELECTED_BADGE_LAYER_ID = "artisan-selected-badge";
const SELECTED_BADGE_COUNT_LAYER_ID = "artisan-selected-badge-count";

const INTERACTIVE_LAYER_IDS = [
  SELECTED_PIN_LAYER_ID,
  PIN_LAYER_ID,
  CLUSTER_LAYER_ID,
];
const PIN_LAYERS = new Set([PIN_LAYER_ID, SELECTED_PIN_LAYER_ID]);

const SELECTED_PIN_SCALE = 1.3;

/**
 * Count badge for pins shared by several shops. It sits on the pin head's
 * top-right; px offsets from the pin tip (the feature's coordinate) scale with
 * the enlarged selected pin.
 */
const BADGE_RADIUS = 8;
const BADGE_OFFSET_X = 9;
const BADGE_OFFSET_Y = PIN_VISUAL_HEIGHT - 3;

function badgeTranslate(scale: number): [number, number] {
  return [
    Math.round(BADGE_OFFSET_X * scale),
    -Math.round(BADGE_OFFSET_Y * scale),
  ];
}

/**
 * Approximate pins sit 0.4-1.2 km from their locality centroid, so they get a
 * faint ~1.2 km ring once zoomed in far enough for that to be readable. Circle
 * radii are in pixels: ~20px at z10 (about 1.2 km at US latitudes), doubling
 * per zoom level so the ring keeps its ground size.
 */
const AREA_RING_MIN_ZOOM = 10;
const AREA_RING_RADIUS_Z10 = 20;
const FIT_PADDING = 60;
const FIT_MAX_ZOOM = 10;
const SELECT_MIN_ZOOM = 11;
const NEAR_ME_ZOOM = 9;

/** Popup offset per anchor so it clears the (enlarged) selected pin. */
const PIN_TOP = Math.round(PIN_VISUAL_HEIGHT * SELECTED_PIN_SCALE) + 6;
const PIN_MID = Math.round(PIN_VISUAL_HEIGHT * SELECTED_PIN_SCALE * 0.68);
const POPUP_OFFSET: NonNullable<PopupProps["offset"]> = {
  center: [0, -PIN_MID],
  top: [0, 6],
  "top-left": [8, 6],
  "top-right": [-8, 6],
  bottom: [0, -PIN_TOP],
  "bottom-left": [8, -PIN_TOP + 6],
  "bottom-right": [-8, -PIN_TOP + 6],
  left: [18, -PIN_MID],
  right: [-18, -PIN_MID],
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ArtisanMapProps = {
  /** Already filtered; shops with `location === null` are ignored. */
  shops: MapShop[];
  selectedShopId: string | null;
  hoveredShopId: string | null;
  onSelectShop: (id: string | null) => void;
  onHoverShop?: (id: string | null) => void;
  /** When provided (and the selected shop has a location), rendered inside a map popup. */
  renderPopup?: (shop: MapShop) => ReactNode;
  /** False on mobile, where the parent shows a bottom sheet instead. Default true. */
  showPopup?: boolean;
  /** Called when "Near me" resolves the viewer's position (used for distances in the list). */
  onUserLocationChange?: (loc: { lat: number; lng: number } | null) => void;
  className?: string;
};

type LocatedShop = MapShop & { location: { lat: number; lng: number } };

type ShopFeatureProps = {
  /** First shop's id; stable per location and the promoted feature id. */
  groupId: string;
  shopId: string;
  name: string;
  precision: MapShop["precision"];
  /** Shops sharing this pin (1 unless co-located storefronts). */
  count: number;
};

/** One map pin: the group's first shop plus how many shops share it. */
type PinGroup = { first: LocatedShop; count: number };

// ---------------------------------------------------------------------------
// Hooks / helpers
// ---------------------------------------------------------------------------

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(cb: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

function isLocated(shop: MapShop): shop is LocatedShop {
  return (
    shop.location !== null &&
    Number.isFinite(shop.location.lat) &&
    Number.isFinite(shop.location.lng)
  );
}

function toFeatureCollection(
  pins: PinGroup[],
): GeoJSON.FeatureCollection<GeoJSON.Point, ShopFeatureProps> {
  return {
    type: "FeatureCollection",
    features: pins.map(({ first, count }) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [first.location.lng, first.location.lat],
      },
      properties: {
        groupId: first.id,
        shopId: first.id,
        name: first.name,
        precision: first.precision,
        count,
      },
    })),
  };
}

function registerPinImage(map: MaplibreMap) {
  try {
    if (!map.hasImage(PIN_IMAGE_ID)) {
      map.addImage(PIN_IMAGE_ID, createPinImage(), {
        sdf: true,
        pixelRatio: PIN_PIXEL_RATIO,
      });
    }
  } catch {
    // Style not ready yet; `style.load` / `styleimagemissing` will retry.
  }
}

/**
 * Registers the SDF pin image as early as possible and re-registers it if a
 * style swap drops it. Rendered as the first child of <Map>.
 */
function PinImageRegistrar() {
  const { current } = useMap();
  useEffect(() => {
    const map = current?.getMap();
    if (!map) return;
    const onMissing = (e: MapStyleImageMissingEvent) => {
      if (e.id === PIN_IMAGE_ID) registerPinImage(map);
    };
    const onStyleLoad = () => registerPinImage(map);
    registerPinImage(map);
    map.on("styleimagemissing", onMissing);
    map.on("style.load", onStyleLoad);
    return () => {
      map.off("styleimagemissing", onMissing);
      map.off("style.load", onStyleLoad);
    };
  }, [current]);
  return null;
}

// ---------------------------------------------------------------------------
// Layer definitions
// ---------------------------------------------------------------------------

function buildLayers(colors: MapBrandColors, selectedGroupId: string | null) {
  const notSelected: FilterSpecification = [
    "all",
    ["!", ["has", "point_count"]],
    ["!=", ["get", "groupId"], selectedGroupId ?? ""],
  ];

  const isShared: FilterSpecification = [">", ["get", "count"], 1];

  const pinLayout: SymbolLayerSpecification["layout"] = {
    "icon-image": PIN_IMAGE_ID,
    "icon-anchor": "bottom",
    "icon-offset": [0, PIN_TIP_INSET],
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
  };

  const pinColor: ExpressionSpecification = [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    colors.pinSelected,
    ["boolean", ["feature-state", "hover"], false],
    colors.pinHover,
    colors.pin,
  ];

  const shadowPaint = {
    "circle-radius": 5,
    "circle-blur": 1,
    "circle-color": "#000000",
    "circle-opacity": 0.28,
    "circle-pitch-alignment": "map",
  } as const;

  // Drawn under everything else and never interactive: it only says "the
  // shop is somewhere around here".
  const areaRing: LayerProps = {
    id: AREA_RING_LAYER_ID,
    type: "circle",
    minzoom: AREA_RING_MIN_ZOOM,
    filter: [
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "precision"], "approximate"],
    ],
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 2],
        ["zoom"],
        AREA_RING_MIN_ZOOM,
        AREA_RING_RADIUS_Z10,
        AREA_RING_MIN_ZOOM + 8,
        AREA_RING_RADIUS_Z10 * 2 ** 8,
      ],
      "circle-color": colors.pin,
      "circle-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        AREA_RING_MIN_ZOOM,
        0,
        AREA_RING_MIN_ZOOM + 1,
        0.08,
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": colors.pin,
      "circle-stroke-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        AREA_RING_MIN_ZOOM,
        0,
        AREA_RING_MIN_ZOOM + 1,
        0.35,
      ],
      "circle-pitch-alignment": "map",
    },
  };

  const cluster: LayerProps = {
    id: CLUSTER_LAYER_ID,
    type: "circle",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": colors.cluster,
      "circle-radius": [
        "step",
        ["get", "shopCount"],
        17,
        5,
        21,
        15,
        26,
        50,
        32,
      ],
      "circle-stroke-width": 3,
      "circle-stroke-color": colors.clusterStroke,
      "circle-stroke-opacity": 0.95,
    },
  };

  const clusterCount: LayerProps = {
    id: CLUSTER_COUNT_LAYER_ID,
    type: "symbol",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["to-string", ["get", "shopCount"]],
      "text-font": MAP_FONT_BOLD,
      "text-size": 13,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": colors.clusterText },
  };

  const pinShadow: LayerProps = {
    id: PIN_SHADOW_LAYER_ID,
    type: "circle",
    filter: notSelected,
    paint: shadowPaint,
  };

  const pins: LayerProps = {
    id: PIN_LAYER_ID,
    type: "symbol",
    filter: notSelected,
    layout: pinLayout,
    paint: {
      "icon-color": pinColor,
      "icon-halo-color": colors.pinStroke,
      "icon-halo-width": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        2.25,
        1.5,
      ],
    },
  };

  const selectedShadow: LayerProps = {
    id: SELECTED_SHADOW_LAYER_ID,
    type: "circle",
    paint: { ...shadowPaint, "circle-radius": 6, "circle-opacity": 0.32 },
  };

  const selectedPin: LayerProps = {
    id: SELECTED_PIN_LAYER_ID,
    type: "symbol",
    layout: { ...pinLayout, "icon-size": SELECTED_PIN_SCALE },
    paint: {
      "icon-color": colors.pinSelected,
      "icon-halo-color": colors.pinStroke,
      "icon-halo-width": 2,
    },
  };

  // Count badges for shared pins. Purely decorative: the pin underneath
  // takes the click, so these are never interactive.
  const badgeCircle = (scale: number) =>
    ({
      type: "circle",
      paint: {
        "circle-radius": BADGE_RADIUS * scale,
        "circle-color": colors.cluster,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": colors.clusterStroke,
        "circle-translate": badgeTranslate(scale),
        "circle-translate-anchor": "viewport",
      },
    }) satisfies Partial<LayerProps>;

  const badgeText = (scale: number) =>
    ({
      type: "symbol",
      layout: {
        "text-field": ["to-string", ["get", "count"]],
        "text-font": MAP_FONT_BOLD,
        "text-size": 11 * scale,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": colors.clusterText,
        "text-translate": badgeTranslate(scale),
        "text-translate-anchor": "viewport",
      },
    }) satisfies Partial<LayerProps>;

  const pinBadge: LayerProps = {
    id: PIN_BADGE_LAYER_ID,
    filter: ["all", notSelected, isShared],
    ...badgeCircle(1),
  };

  const pinBadgeCount: LayerProps = {
    id: PIN_BADGE_COUNT_LAYER_ID,
    filter: ["all", notSelected, isShared],
    ...badgeText(1),
  };

  const selectedBadge: LayerProps = {
    id: SELECTED_BADGE_LAYER_ID,
    filter: isShared,
    ...badgeCircle(SELECTED_PIN_SCALE),
  };

  const selectedBadgeCount: LayerProps = {
    id: SELECTED_BADGE_COUNT_LAYER_ID,
    filter: isShared,
    ...badgeText(SELECTED_PIN_SCALE),
  };

  return {
    areaRing,
    cluster,
    clusterCount,
    pinShadow,
    pins,
    pinBadge,
    pinBadgeCount,
    selectedShadow,
    selectedPin,
    selectedBadge,
    selectedBadgeCount,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ArtisanMap({
  shops,
  selectedShopId,
  hoveredShopId,
  onSelectShop,
  onHoverShop,
  renderPopup,
  showPopup = true,
  onUserLocationChange,
  className,
}: ArtisanMapProps) {
  const mapStyle = useArtisanMapStyle();
  const theme = useMapTheme();
  const colors = MAP_BRAND_COLORS[theme];
  const reducedMotion = usePrefersReducedMotion();

  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [cursor, setCursor] = useState<string>("");
  const [localHoverId, setLocalHoverId] = useState<string | null>(null);
  const localHoverRef = useRef<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);

  // Keep latest callbacks in refs so map event handlers stay stable.
  const onSelectRef = useRef(onSelectShop);
  const onHoverRef = useRef(onHoverShop);
  const onUserLocationRef = useRef(onUserLocationChange);
  const selectedIdRef = useRef(selectedShopId);
  useEffect(() => {
    onSelectRef.current = onSelectShop;
    onHoverRef.current = onHoverShop;
    onUserLocationRef.current = onUserLocationChange;
    selectedIdRef.current = selectedShopId;
  });

  const located = useMemo(() => shops.filter(isLocated), [shops]);
  const shopById = useMemo(() => {
    const m = new Map<string, LocatedShop>();
    for (const s of located) m.set(s.id, s);
    return m;
  }, [located]);
  // Shops sharing a storefront collapse into one pin (see `co-located.ts`).
  const groups = useMemo(() => {
    const byShopId = groupCoLocatedShops(located);
    const pins: PinGroup[] = [];
    for (const shop of located) {
      const group = byShopId.get(shop.id);
      if (group?.[0] === shop) {
        pins.push({ first: shop, count: group.length });
      }
    }
    return { byShopId, pins };
  }, [located]);
  const groupsRef = useRef(groups.byShopId);
  useEffect(() => {
    groupsRef.current = groups.byShopId;
  });
  const groupIdByShopId = useMemo(() => {
    const m = new Map<string, string>();
    for (const [shopId, group] of groups.byShopId) m.set(shopId, group[0]!.id);
    return m;
  }, [groups]);
  const geojson = useMemo(() => toFeatureCollection(groups.pins), [groups]);
  const idsKey = useMemo(
    () =>
      located
        .map((s) => s.id)
        .sort()
        .join("|"),
    [located],
  );

  const selectedShop = selectedShopId
    ? (shopById.get(selectedShopId) ?? null)
    : null;
  // The selected shop is drawn (and its popup anchored) at its group's pin,
  // so cycling through co-located shops never moves either.
  const selectedGroup = selectedShop
    ? (groups.byShopId.get(selectedShop.id) ?? null)
    : null;
  const selectedPinShop =
    (selectedGroup?.[0] as LocatedShop | undefined) ?? null;
  const selectedGroupId = selectedPinShop?.id ?? null;
  const selectedGeojson = useMemo(
    () =>
      toFeatureCollection(
        selectedPinShop && selectedGroup
          ? [{ first: selectedPinShop, count: selectedGroup.length }]
          : [],
      ),
    [selectedPinShop, selectedGroup],
  );

  const layers = useMemo(
    () => buildLayers(colors, selectedGroupId),
    [colors, selectedGroupId],
  );

  const duration = useCallback(
    (ms: number) => (reducedMotion ? 0 : ms),
    [reducedMotion],
  );

  // --- Feature-state sync (hover / selected) -------------------------------

  const syncFeatureState = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map?.getSource(SOURCE_ID)) return;
    map.removeFeatureState({ source: SOURCE_ID });
    // Feature ids are group ids; any member shop maps to its group's pin.
    const toGroupId = (shopId: string) => groupIdByShopId.get(shopId) ?? shopId;
    if (selectedShopId) {
      map.setFeatureState(
        { source: SOURCE_ID, id: toGroupId(selectedShopId) },
        { selected: true },
      );
    }
    for (const shopId of new Set([hoveredShopId, localHoverId])) {
      if (shopId) {
        map.setFeatureState(
          { source: SOURCE_ID, id: toGroupId(shopId) },
          { hover: true },
        );
      }
    }
  }, [selectedShopId, hoveredShopId, localHoverId, groupIdByShopId]);

  const syncRef = useRef(syncFeatureState);
  useEffect(() => {
    syncRef.current = syncFeatureState;
    if (mapReady) syncFeatureState();
  }, [syncFeatureState, mapReady, geojson, mapStyle]);

  // Re-apply after the source is (re)created, e.g. following a theme swap.
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const onSourceData = (e: {
      sourceId?: string;
      sourceDataType?: string;
    }) => {
      if (e.sourceId === SOURCE_ID && e.sourceDataType === "metadata") {
        syncRef.current();
      }
    };
    map.on("sourcedata", onSourceData);
    return () => {
      map.off("sourcedata", onSourceData);
    };
  }, [mapReady]);

  // --- Camera: fit to the visible set of shops ------------------------------

  const fittedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    if (fittedKeyRef.current === idsKey) return;
    const isFirstFit = fittedKeyRef.current === null;
    fittedKeyRef.current = idsKey;

    const animate = isFirstFit ? 0 : duration(800);
    if (located.length === 0) {
      map.jumpTo({
        center: [US_CENTER.longitude, US_CENTER.latitude],
        zoom: US_ZOOM,
      });
      return;
    }
    // One pin (possibly several co-located shops): zero-area bounds would
    // make fitBounds compute a NaN camera, so centre on it instead.
    if (groups.pins.length === 1) {
      const only = groups.pins[0]!.first;
      map.flyTo({
        center: [only.location.lng, only.location.lat],
        zoom: FIT_MAX_ZOOM,
        duration: animate,
      });
      return;
    }
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    for (const s of located) {
      minLng = Math.min(minLng, s.location.lng);
      minLat = Math.min(minLat, s.location.lat);
      maxLng = Math.max(maxLng, s.location.lng);
      maxLat = Math.max(maxLat, s.location.lat);
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM, duration: animate },
    );
  }, [idsKey, located, groups, mapReady, duration]);

  // --- Camera: fly to the selected shop ------------------------------------

  const popupVisible = showPopup && !!renderPopup && !!selectedShop;
  const lastFlownRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mapReady) return;
    if (!selectedPinShop) {
      lastFlownRef.current = null;
      return;
    }
    // Keyed on the group so cycling co-located shops doesn't re-fly.
    if (lastFlownRef.current === selectedPinShop.id) return;
    lastFlownRef.current = selectedPinShop.id;
    const map = mapRef.current;
    if (!map) return;
    const height = map.getContainer().clientHeight;
    // Push the pin below centre so the popup above it has room.
    const offsetY = popupVisible ? Math.min(Math.round(height * 0.22), 150) : 0;
    map.flyTo({
      center: [selectedPinShop.location.lng, selectedPinShop.location.lat],
      zoom: Math.max(map.getZoom(), SELECT_MIN_ZOOM),
      offset: [0, offsetY],
      duration: duration(900),
      essential: false,
    });
  }, [selectedPinShop, mapReady, popupVisible, duration]);

  // --- Pointer interaction --------------------------------------------------

  const setHover = useCallback((id: string | null) => {
    if (localHoverRef.current === id) return;
    localHoverRef.current = id;
    setLocalHoverId(id);
    onHoverRef.current?.(id);
  }, []);

  const handleMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      const features = e.features ?? [];
      setCursor(features.length > 0 ? "pointer" : "");
      const top = features[0];
      const id =
        top && PIN_LAYERS.has(top.layer.id)
          ? String((top.properties as Partial<ShopFeatureProps>).shopId ?? "")
          : "";
      setHover(id || null);
    },
    [setHover],
  );

  const handleMouseLeave = useCallback(() => {
    setCursor("");
    setHover(null);
  }, [setHover]);

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      // Ignore clicks that originate from popups / markers / controls.
      const target = e.originalEvent?.target;
      if (
        target instanceof Element &&
        !target.classList.contains("maplibregl-canvas")
      ) {
        return;
      }
      // Query at the click point rather than trusting `e.features`, which
      // react-map-gl fills from the last mousemove (stale on touch taps).
      const map = mapRef.current?.getMap();
      if (!map) return;
      const feature = map.queryRenderedFeatures(e.point, {
        layers: INTERACTIVE_LAYER_IDS.filter((id) => !!map.getLayer(id)),
      })[0];
      if (!feature) {
        onSelectRef.current(null);
        return;
      }
      if (feature.layer.id === CLUSTER_LAYER_ID) {
        const source = map.getSource<GeoJSONSource>(SOURCE_ID);
        const clusterId = Number(
          (feature.properties as { cluster_id?: number }).cluster_id,
        );
        if (!source || !Number.isFinite(clusterId)) return;
        const geometry = feature.geometry;
        if (geometry.type !== "Point") return;
        const [lng, lat] = geometry.coordinates as [number, number];
        void source
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => {
            map.easeTo({
              center: [lng, lat],
              zoom: Math.min(zoom, map.getMaxZoom()),
              duration: duration(500),
            });
          })
          .catch(() => {
            map.easeTo({
              center: [lng, lat],
              zoom: map.getZoom() + 2,
              duration: duration(500),
            });
          });
        return;
      }
      const shopId = (feature.properties as Partial<ShopFeatureProps>).shopId;
      if (!shopId) return;
      // Already showing a shop at this pin: leave it, the card's pager cycles.
      const selectedId = selectedIdRef.current;
      const group = groupsRef.current.get(String(shopId));
      if (selectedId && group?.some((s) => s.id === selectedId)) return;
      onSelectRef.current(String(shopId));
    },
    [duration],
  );

  // --- Near me --------------------------------------------------------------

  const handleNearMe = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      toast.error("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    // The position moves the map and is handed to the parent for client-side
    // distance sorting. It is never sent to the server.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(next);
        onUserLocationRef.current?.(next);
        mapRef.current?.flyTo({
          center: [next.lng, next.lat],
          zoom: NEAR_ME_ZOOM,
          duration: duration(1200),
        });
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Enable it in your browser to find artisans near you."
            : "We couldn't determine your location. Please try again.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, [duration]);

  // --- Render ---------------------------------------------------------------

  if (!mapStyle) {
    return (
      <div className={cn("relative h-full w-full", className)}>
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
    );
  }

  return (
    <div
      className={cn("artisan-map relative h-full w-full", className)}
      style={
        {
          "--artisan-map-user-color": colors.userLocation,
        } as CSSProperties
      }
    >
      <MapGL
        ref={mapRef}
        initialViewState={{ ...US_CENTER, zoom: US_ZOOM }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        workerUrl={MAPLIBRE_WORKER_URL}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        maxPitch={0}
        interactiveLayerIds={INTERACTIVE_LAYER_IDS}
        cursor={cursor}
        onLoad={() => setMapReady(true)}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseOut={handleMouseLeave}
      >
        <PinImageRegistrar />

        <Source
          id={SOURCE_ID}
          type="geojson"
          data={geojson}
          promoteId="groupId"
          cluster
          clusterRadius={50}
          clusterMaxZoom={13}
          clusterProperties={{ shopCount: ["+", ["get", "count"]] }}
        >
          <Layer {...layers.areaRing} />
          <Layer {...layers.cluster} />
          <Layer {...layers.clusterCount} />
          <Layer {...layers.pinShadow} />
          <Layer {...layers.pins} />
          <Layer {...layers.pinBadge} />
          <Layer {...layers.pinBadgeCount} />
        </Source>

        <Source
          id={SELECTED_SOURCE_ID}
          type="geojson"
          data={selectedGeojson}
          promoteId="groupId"
        >
          <Layer {...layers.selectedShadow} />
          <Layer {...layers.selectedPin} />
          <Layer {...layers.selectedBadge} />
          <Layer {...layers.selectedBadgeCount} />
        </Source>

        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="center"
          >
            <div
              className="artisan-map-user-dot"
              role="img"
              aria-label="Your location"
            />
          </Marker>
        )}

        {popupVisible && selectedShop && selectedPinShop && renderPopup && (
          <Popup
            longitude={selectedPinShop.location.lng}
            latitude={selectedPinShop.location.lat}
            className="artisan-map-popup"
            closeButton={false}
            closeOnClick={false}
            maxWidth="320px"
            offset={POPUP_OFFSET}
            focusAfterOpen={false}
            onClose={() => onSelectRef.current(null)}
          >
            {renderPopup(selectedShop)}
          </Popup>
        )}

        <NavigationControl position="top-right" showCompass={false} />
        <AttributionControl position="bottom-right" compact />
      </MapGL>

      <MapLegend colors={colors} showUserLocation={!!userLocation} />

      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label="Show artisans near me"
        title="Show artisans near me"
        onClick={handleNearMe}
        disabled={locating}
        className="border-border bg-card text-foreground hover:bg-secondary absolute top-[82px] right-[10px] z-10 size-[31px] rounded-[4px] border shadow-xs"
      >
        {locating ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <LocateFixed className="size-4" aria-hidden />
        )}
      </Button>
    </div>
  );
}
