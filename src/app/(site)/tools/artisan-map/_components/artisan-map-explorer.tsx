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
import { useDebouncedCallback } from "use-debounce";

import type { BoundaryLayerId } from "../_lib/boundaries";
import type { LatLng } from "../_lib/map-stats";
import type { MapShop } from "../_lib/types";
import type { MapUrlUpdates, MapViewport } from "../_lib/url-state";
import type { ShopMapCardPager } from "./shop-map-card";
import type { CollaborationTag } from "~/lib/constants/collaboration-tags";
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
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";

import { groupCoLocatedShops } from "../_lib/co-located";
import {
  parseCollabTags,
  serializeCollabTags,
  toggleCollabTag,
} from "../_lib/collab";
import { filterMapShops, hasActiveFilters } from "../_lib/filter";
import { computeMapStats, distanceMiles } from "../_lib/map-stats";
import {
  countSectors,
  nextSectors,
  parseSectors,
  serializeSectors,
  visibleSectorSlugs,
} from "../_lib/sectors";
import {
  applyUrlUpdates,
  clearFilterUpdates,
  parseList,
  parseMapUrlState,
  viewportUpdates,
} from "../_lib/url-state";
import { ArtisanMapLazy } from "./artisan-map-lazy";
import { activeCollabCount, CollabFilterPanel } from "./collab-filter";
import { MapAbout } from "./map-about";
import { useMapSectors } from "./map-sectors-context";
import { AttributeChecklist, MapSidebar, SearchBox } from "./map-sidebar";
import { MapStatsBar } from "./map-stats-bar";
import { SectorChips } from "./sector-chips";
import { ShopMapCard } from "./shop-map-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DESKTOP_QUERY = "(min-width: 768px)";

/** Wait for the camera to settle before rewriting `lng`/`lat`/`zoom`. */
const VIEWPORT_URL_DEBOUNCE_MS = 400;

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ArtisanMapExplorer({ shops }: { shops: MapShop[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();

  const allSectors = useMapSectors();
  const sectorSlugs = useMemo(
    () => allSectors.map((sector) => sector.slug),
    [allSectors],
  );

  const urlState = parseMapUrlState(searchParams, sectorSlugs);
  const { query, inPerson, collab, layer } = urlState;
  // List params are re-parsed from their raw strings so their identity (and
  // the filtering below) only changes with them, not with `?shop=`.
  const attributeParam = searchParams.get("attributes");
  const sectorParam = searchParams.get("sectors");
  const attributes = useMemo(() => parseList(attributeParam), [attributeParam]);
  const sectors = useMemo(
    () => parseSectors(sectorParam, sectorSlugs),
    [sectorParam, sectorSlugs],
  );
  const offerParam = searchParams.get("offers");
  const needParam = searchParams.get("needs");
  const offers = useMemo(() => parseCollabTags(offerParam), [offerParam]);
  const needs = useMemo(() => parseCollabTags(needParam), [needParam]);

  // The camera is read once: after that the map owns it and writes it back.
  const [initialViewport] = useState(() => urlState.viewport);

  // Selection is held locally (instant) and mirrored into `?shop=`.
  const [selectedId, setSelectedId] = useState<string | null>(
    () => urlState.shop,
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  /**
   * Rewrites the query string in place. `history.replaceState` is wired into
   * `useSearchParams` by Next, and unlike `router.replace` it does not
   * re-run the server page (and its database query) on every keystroke.
   */
  const updateUrl = useCallback(
    (updates: MapUrlUpdates) => {
      const qs = applyUrlUpdates(window.location.search, updates);
      // `null` state is what lets Next sync this into useSearchParams.
      window.history.replaceState(
        null,
        "",
        qs ? `${pathname}?${qs}` : pathname,
      );
    },
    [pathname],
  );

  const writeViewport = useDebouncedCallback(
    (viewport: MapViewport) => updateUrl(viewportUpdates(viewport)),
    VIEWPORT_URL_DEBOUNCE_MS,
  );

  /** The current URL, with any pending camera write applied first. */
  const getShareUrl = useCallback(() => {
    writeViewport.flush();
    return window.location.href;
  }, [writeViewport]);

  // Every filter composes in `_lib/filter.ts`; each facet's counts ignore
  // that facet's own selection.
  const filters = useMemo(
    () => ({ query, inPerson, attributes, sectors, collab, offers, needs }),
    [query, inPerson, attributes, sectors, collab, offers, needs],
  );
  const {
    shops: filtered,
    attributeCounts,
    sectorCounts,
    collabCount,
    offerCounts,
    needCounts,
  } = useMemo(
    () => filterMapShops(shops, filters, sectorSlugs),
    [shops, filters, sectorSlugs],
  );
  // Unfiltered, so a sector's chip doesn't vanish when a search excludes it.
  const sectorTotals = useMemo(
    () => countSectors(shops, sectorSlugs),
    [shops, sectorSlugs],
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

  const hasFilters = hasActiveFilters(filters);
  // Sector chips stay visible on mobile, so the Filters badge leaves them out.
  const activeFilterCount =
    attributes.length +
    (inPerson ? 1 : 0) +
    activeCollabCount({ collab, offers, needs });
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

  const setCollab = useCallback(
    (on: boolean) => updateUrl({ collab: on ? "1" : null }),
    [updateUrl],
  );

  const toggleOffer = useCallback(
    (tag: CollaborationTag, checked: boolean) =>
      updateUrl({
        offers: serializeCollabTags(toggleCollabTag(offers, tag, checked)),
      }),
    [offers, updateUrl],
  );

  const toggleNeed = useCallback(
    (tag: CollaborationTag, checked: boolean) =>
      updateUrl({
        needs: serializeCollabTags(toggleCollabTag(needs, tag, checked)),
      }),
    [needs, updateUrl],
  );

  const setSectors = useCallback(
    (next: string[]) =>
      updateUrl({ sectors: serializeSectors(next, sectorSlugs) }),
    [sectorSlugs, updateUrl],
  );

  /** A breakdown bar acts like that sector's chip. */
  const pickSector = useCallback(
    (sector: string) => {
      const visible = visibleSectorSlugs(sectorTotals, sectors, sectorSlugs);
      setSectors(nextSectors(sectors, sector, sectorSlugs, visible));
    },
    [sectorSlugs, sectorTotals, sectors, setSectors],
  );

  const setLayer = useCallback(
    (next: BoundaryLayerId | null) => updateUrl({ layer: next }),
    [updateUrl],
  );

  // Resets filters only; the selection, camera and layer survive.
  const clearFilters = useCallback(
    () => updateUrl(clearFilterUpdates()),
    [updateUrl],
  );

  const selectFromDrawer = useCallback(
    (id: string | null) => {
      selectShop(id);
      if (id) setListOpen(false);
    },
    [selectShop],
  );

  const collabProps = {
    collab,
    onCollabChange: setCollab,
    collabCount,
    offers,
    onToggleOffer: toggleOffer,
    offerCounts,
    needs,
    onToggleNeed: toggleNeed,
    needCounts,
  };

  const sidebarProps = {
    ...collabProps,
    shops: filtered,
    totalCount: shops.length,
    query,
    onQueryChange: setQuery,
    attributes,
    onToggleAttribute: toggleAttribute,
    inPerson,
    onInPersonChange: setInPerson,
    attributeCounts,
    sectors,
    onSectorsChange: setSectors,
    sectorCounts,
    sectorTotals,
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
        sectorCounts={sectorCounts}
        selectedSectors={sectors}
        onPickSector={pickSector}
        attributeCounts={attributeCounts}
        selectedAttributes={attributes}
        onToggleAttribute={toggleAttribute}
        getShareUrl={getShareUrl}
        onOpenAbout={() => setAboutOpen(true)}
      />

      <MapAbout
        open={aboutOpen}
        onOpenChange={setAboutOpen}
        isDesktop={isDesktop}
        shops={shops}
        filteredShops={filtered}
        hasFilters={hasFilters}
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

        {/* Mobile sector chips: always visible, one swipeable row */}
        <div className="bg-background shrink-0 border-b px-2 py-1.5 md:hidden">
          <SectorChips
            layout="scroll"
            selected={sectors}
            onChange={setSectors}
            counts={sectorCounts}
            totals={sectorTotals}
          />
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
            initialViewport={initialViewport}
            onViewportChange={writeViewport}
            boundaryLayer={layer}
            onBoundaryLayerChange={setLayer}
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
                Show storefronts, artisan attributes, and collaborators.
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
              <h3 className="text-muted-foreground px-2 pt-3 pb-1 text-xs font-semibold tracking-wide uppercase">
                Attributes
              </h3>
              <AttributeChecklist
                selected={attributes}
                onToggle={toggleAttribute}
                counts={attributeCounts}
              />
              <Separator className="my-2" />
              <h3 className="text-muted-foreground px-2 pt-1 pb-1 text-xs font-semibold tracking-wide uppercase">
                Collaborate
              </h3>
              <CollabFilterPanel {...collabProps} />
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
