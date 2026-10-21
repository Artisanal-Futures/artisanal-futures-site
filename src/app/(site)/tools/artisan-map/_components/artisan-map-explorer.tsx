"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { List, SlidersHorizontal } from "lucide-react";

import type { LatLng } from "../_lib/map-stats";
import type { MapShop } from "../_lib/types";
import type { ShopMapCardPager } from "./shop-map-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

import { groupCoLocatedShops } from "../_lib/co-located";
import {
  computeMapStats,
  countAttributes,
  distanceMiles,
} from "../_lib/map-stats";
import { ArtisanMapLazy } from "./artisan-map-lazy";
import { AttributeChecklist, MapSidebar, SearchBox } from "./map-sidebar";
import { MapStatsBar } from "./map-stats-bar";
import { ShopMapCard } from "./shop-map-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribeDesktop(cb: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

/** True at the `md` breakpoint and up. Server/hydration snapshot is `true`. */
function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
}

function matchesQuery(shop: MapShop, needle: string) {
  if (!needle) return true;
  return [shop.name, shop.ownerName, shop.locality, ...shop.attributeTags].some(
    (field) => field?.toLowerCase().includes(needle),
  );
}

const byName = (a: MapShop, b: MapShop) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArtisanMapExplorer({ shops }: { shops: MapShop[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();

  const query = searchParams.get("q") ?? "";
  const attributeParam = searchParams.get("attributes") ?? "";
  const attributes = useMemo(
    () => attributeParam.split(",").filter(Boolean),
    [attributeParam],
  );
  // "Only storefronts you can visit": street-pinned (exact) shops.
  const inPerson = searchParams.get("visit") === "1";

  // Selection is held locally (instant) and mirrored into `?shop=`.
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    searchParams.get("shop"),
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  /**
   * Rewrites the query string in place. `history.replaceState` is wired into
   * `useSearchParams` by Next, and unlike `router.replace` it does not
   * re-run the server page (and its database query) on every keystroke.
   */
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      // `null` state is what lets Next sync this into useSearchParams.
      window.history.replaceState(
        null,
        "",
        qs ? `${pathname}?${qs}` : pathname,
      );
    },
    [pathname],
  );

  // Search + storefront filters, before the attribute filter. Attribute facet
  // counts are computed from this set so they ignore the attribute filter.
  const baseMatched = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shops.filter(
      (shop) =>
        matchesQuery(shop, needle) && (!inPerson || shop.precision === "exact"),
    );
  }, [shops, query, inPerson]);

  const filtered = useMemo(() => {
    const matched =
      attributes.length === 0
        ? baseMatched
        : baseMatched.filter((shop) =>
            shop.attributeTags.some((tag) => attributes.includes(tag)),
          );
    return [...matched].sort(byName);
  }, [baseMatched, attributes]);

  const attributeCounts = useMemo(
    () => countAttributes(baseMatched),
    [baseMatched],
  );
  const stats = useMemo(() => computeMapStats(filtered), [filtered]);

  // Miles from the user to each located shop, once "Near me" has succeeded.
  const distances = useMemo(() => {
    if (!userLocation) return null;
    const map = new Map<string, number>();
    for (const shop of filtered) {
      if (shop.location) {
        map.set(shop.id, distanceMiles(userLocation, shop.location));
      }
    }
    return map;
  }, [filtered, userLocation]);

  const hasFilters = query.trim() !== "" || attributes.length > 0 || inPerson;
  const activeFilterCount = attributes.length + (inPerson ? 1 : 0);
  const selectedShop = useMemo(
    () => filtered.find((s) => s.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  // Storefronts sharing one pin; the card pages through them.
  const coLocated = useMemo(() => groupCoLocatedShops(filtered), [filtered]);

  // Drop a selection that was filtered out (or never existed).
  useEffect(() => {
    if (selectedId && !selectedShop) {
      setSelectedId(null);
      updateUrl({ shop: null });
    }
  }, [selectedId, selectedShop, updateUrl]);

  const selectShop = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      updateUrl({ shop: id });
    },
    [updateUrl],
  );

  /** Pager props for a shop's card, or undefined when it has the pin to itself. */
  const pagerFor = (shop: MapShop): ShopMapCardPager | undefined => {
    const group = coLocated.get(shop.id);
    if (!group || group.length < 2) return undefined;
    const index = group.findIndex((s) => s.id === shop.id);
    const step = (delta: number) =>
      selectShop(group[(index + delta + group.length) % group.length]!.id);
    return {
      index,
      total: group.length,
      onPrev: () => step(-1),
      onNext: () => step(1),
    };
  };

  const setQuery = useCallback(
    (value: string) => updateUrl({ q: value || null }),
    [updateUrl],
  );

  const toggleAttribute = useCallback(
    (attribute: string, checked: boolean) => {
      const next = checked
        ? [...new Set([...attributes, attribute])]
        : attributes.filter((a) => a !== attribute);
      updateUrl({ attributes: next.length > 0 ? next.join(",") : null });
    },
    [attributes, updateUrl],
  );

  const setInPerson = useCallback(
    (on: boolean) => updateUrl({ visit: on ? "1" : null }),
    [updateUrl],
  );

  const clearFilters = useCallback(
    () => updateUrl({ q: null, attributes: null, visit: null }),
    [updateUrl],
  );

  const selectFromDrawer = useCallback(
    (id: string | null) => {
      selectShop(id);
      if (id) setListOpen(false);
    },
    [selectShop],
  );

  const sidebarProps = {
    shops: filtered,
    totalCount: shops.length,
    query,
    onQueryChange: setQuery,
    attributes,
    onToggleAttribute: toggleAttribute,
    inPerson,
    onInPersonChange: setInPerson,
    attributeCounts,
    distances,
    hasFilters,
    onClearFilters: clearFilters,
    selectedShopId: selectedShop?.id ?? null,
    hoveredShopId: hoveredId,
    onHoverShop: setHoveredId,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MapStatsBar
        stats={stats}
        attributeCounts={attributeCounts}
        selectedAttributes={attributes}
        onToggleAttribute={toggleAttribute}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Desktop sidebar */}
        <aside
          aria-label="Artisan list and filters"
          className="bg-background hidden w-[380px] shrink-0 flex-col border-r md:flex"
        >
          <MapSidebar
            {...sidebarProps}
            onSelectShop={selectShop}
            inlineCard
            toggleSelected
          />
        </aside>

        {/* Mobile search bar */}
        <div className="bg-background flex shrink-0 items-center gap-2 border-b p-2 md:hidden">
          <SearchBox value={query} onChange={setQuery} className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={() => setFiltersOpen(true)}
            aria-label={
              activeFilterCount > 0
                ? `Filters, ${activeFilterCount} active`
                : "Filters"
            }
          >
            <SlidersHorizontal aria-hidden />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="h-5 min-w-5 px-1.5">{activeFilterCount}</Badge>
            )}
          </Button>
        </div>

        {/* Map */}
        <div className="relative min-h-0 min-w-0 flex-1">
          <ArtisanMapLazy
            shops={filtered}
            selectedShopId={selectedShop?.id ?? null}
            hoveredShopId={hoveredId}
            onSelectShop={selectShop}
            onHoverShop={setHoveredId}
            onUserLocationChange={setUserLocation}
            showPopup={isDesktop}
            renderPopup={(shop) => (
              <ShopMapCard
                shop={shop}
                onClose={() => selectShop(null)}
                pager={pagerFor(shop)}
                className="w-[300px]"
              />
            )}
          />

          {/* Mobile: selected shop bottom sheet */}
          {selectedShop ? (
            <div className="absolute inset-x-3 bottom-3 z-20 max-h-[70%] overflow-y-auto rounded-xl md:hidden">
              <ShopMapCard
                shop={selectedShop}
                onClose={() => selectShop(null)}
                pager={pagerFor(selectedShop)}
              />
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => setListOpen(true)}
              className="absolute bottom-9 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-lg md:hidden"
            >
              <List aria-hidden />
              List ({filtered.length})
            </Button>
          )}
        </div>

        {/* Mobile: list drawer */}
        <Drawer open={listOpen} onOpenChange={setListOpen}>
          <DrawerContent className="h-[80dvh] max-h-[80dvh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle>Artisans</DrawerTitle>
              <DrawerDescription className="sr-only">
                Browse artisans and select one to see it on the map.
              </DrawerDescription>
            </DrawerHeader>
            <MapSidebar
              {...sidebarProps}
              onSelectShop={selectFromDrawer}
              hideControls
            />
          </DrawerContent>
        </Drawer>

        {/* Mobile: filters drawer */}
        <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DrawerContent>
            <DrawerHeader className="pb-2">
              <DrawerTitle>Filter artisans</DrawerTitle>
              <DrawerDescription>
                Show artisans with any of the selected attributes.
              </DrawerDescription>
            </DrawerHeader>
            <div
              data-vaul-no-drag
              className="min-h-0 flex-1 overflow-y-auto px-2"
            >
              <div className="flex items-center gap-3 px-2 pb-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <Label htmlFor="map-visit-only" className="text-sm">
                    Only storefronts you can visit
                  </Label>
                  <p
                    id="map-visit-only-hint"
                    className="text-muted-foreground text-xs"
                  >
                    Shops pinned at a public street address
                  </p>
                </div>
                <Switch
                  id="map-visit-only"
                  aria-describedby="map-visit-only-hint"
                  checked={inPerson}
                  onCheckedChange={setInPerson}
                />
              </div>
              <AttributeChecklist
                selected={attributes}
                onToggle={toggleAttribute}
                counts={attributeCounts}
              />
            </div>
            <DrawerFooter className="flex-row gap-2">
              {hasFilters && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )}
              <DrawerClose asChild>
                <Button type="button" className="flex-1">
                  Show {filtered.length}{" "}
                  {filtered.length === 1 ? "artisan" : "artisans"}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
