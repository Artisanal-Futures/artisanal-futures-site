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

import { groupCoLocatedShops } from "../_lib/co-located";
import { ArtisanMapLazy } from "./artisan-map-lazy";
import { AttributeChecklist, MapSidebar, SearchBox } from "./map-sidebar";
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

  // Selection is held locally (instant) and mirrored into `?shop=`.
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    searchParams.get("shop"),
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shops
      .filter((shop) => {
        if (!matchesQuery(shop, needle)) return false;
        if (attributes.length === 0) return true;
        return shop.attributeTags.some((tag) => attributes.includes(tag));
      })
      .sort(byName);
  }, [shops, query, attributes]);

  const hasFilters = query.trim() !== "" || attributes.length > 0;
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

  const clearFilters = useCallback(
    () => updateUrl({ q: null, attributes: null }),
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
    hasFilters,
    onClearFilters: clearFilters,
    selectedShopId: selectedShop?.id ?? null,
    hoveredShopId: hoveredId,
    onHoverShop: setHoveredId,
  };

  return (
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
            attributes.length > 0
              ? `Filters, ${attributes.length} active`
              : "Filters"
          }
        >
          <SlidersHorizontal aria-hidden />
          Filters
          {attributes.length > 0 && (
            <Badge className="h-5 min-w-5 px-1.5">{attributes.length}</Badge>
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
            <AttributeChecklist
              selected={attributes}
              onToggle={toggleAttribute}
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
  );
}
