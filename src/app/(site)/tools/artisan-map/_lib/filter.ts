import type { MapShop } from "./types";
import type { MapUrlState } from "./url-state";
import type { CollaborationTag } from "~/lib/constants/collaboration-tags";

import { countCollabTags } from "./collab";
import { countAttributes } from "./map-stats";
import { countSectors } from "./sectors";

/**
 * Filtering for the Artisan Map. Each filter is one predicate in `FILTERS`,
 * and a shop must pass all of them (AND across filters; "any of" within a
 * multi-select one). Faceted filters count shops while ignoring their own
 * selection, so picking a sector never zeroes the other sectors' counts.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MapFilters = Pick<
  MapUrlState,
  | "query"
  | "attributes"
  | "inPerson"
  | "sectors"
  | "collab"
  | "offers"
  | "needs"
>;

type FilterKey = keyof MapFilters;
type ShopPredicate = (shop: MapShop) => boolean;

export type MapFilterResult = {
  /** Shops passing every filter, sorted by name. */
  shops: MapShop[];
  /** Per-attribute counts under every filter but `attributes`. */
  attributeCounts: Map<string, number>;
  /** Per-sector counts under every filter but `sectors`. */
  sectorCounts: Map<string, number>;
  /** Shops open to collaborate under every filter but `collab`. */
  collabCount: number;
  /** Per-tag "Can offer" counts under every filter but `offers`. */
  offerCounts: Map<CollaborationTag, number>;
  /** Per-tag "Looking for" counts under every filter but `needs`. */
  needCounts: Map<CollaborationTag, number>;
};

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

function matchesQuery(shop: MapShop, needle: string) {
  return [shop.name, shop.ownerName, shop.locality, ...shop.attributeTags].some(
    (field) => field?.toLowerCase().includes(needle),
  );
}

/** Builds each filter's predicate, or null when that filter is inactive. */
const FILTERS: {
  [K in FilterKey]: (value: MapFilters[K]) => ShopPredicate | null;
} = {
  query: (query) => {
    const needle = query.trim().toLowerCase();
    return needle ? (shop) => matchesQuery(shop, needle) : null;
  },
  // Storefronts you can visit: street-pinned (exact) shops.
  inPerson: (on) => (on ? (shop) => shop.precision === "exact" : null),
  attributes: (attributes) =>
    attributes.length > 0
      ? (shop) => shop.attributeTags.some((tag) => attributes.includes(tag))
      : null,
  sectors: (sectors) =>
    sectors.length > 0 ? (shop) => sectors.includes(shop.sector) : null,
  collab: (on) => (on ? (shop) => shop.collab !== null : null),
  offers: (offers) =>
    offers.length > 0
      ? (shop) => !!shop.collab?.offerTags.some((tag) => offers.includes(tag))
      : null,
  needs: (needs) =>
    needs.length > 0
      ? (shop) => !!shop.collab?.needTags.some((tag) => needs.includes(tag))
      : null,
};

function predicatesFor(filters: MapFilters, ignore?: FilterKey) {
  const predicates: ShopPredicate[] = [];
  for (const key of Object.keys(FILTERS) as FilterKey[]) {
    if (key === ignore) continue;
    // Each builder takes its own key's value; TS can't correlate the two.
    const build = FILTERS[key] as (
      value: MapFilters[FilterKey],
    ) => ShopPredicate | null;
    const predicate = build(filters[key]);
    if (predicate) predicates.push(predicate);
  }
  return predicates;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Shops passing every active filter except `ignore`, in input order. */
export function matchShops(
  shops: MapShop[],
  filters: MapFilters,
  ignore?: FilterKey,
): MapShop[] {
  const predicates = predicatesFor(filters, ignore);
  if (predicates.length === 0) return shops;
  return shops.filter((shop) => predicates.every((p) => p(shop)));
}

/** True when any filter (not just the facets) narrows the list. */
export function hasActiveFilters(filters: MapFilters): boolean {
  return predicatesFor(filters).length > 0;
}

const byName = (a: MapShop, b: MapShop) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/** The filtered, name-sorted shops plus each facet's counts. */
export function filterMapShops(
  shops: MapShop[],
  filters: MapFilters,
  sectorSlugs: readonly string[],
): MapFilterResult {
  return {
    shops: [...matchShops(shops, filters)].sort(byName),
    attributeCounts: countAttributes(matchShops(shops, filters, "attributes")),
    sectorCounts: countSectors(
      matchShops(shops, filters, "sectors"),
      sectorSlugs,
    ),
    collabCount: matchShops(shops, filters, "collab").filter(
      (shop) => shop.collab !== null,
    ).length,
    offerCounts: countCollabTags(
      matchShops(shops, filters, "offers"),
      "offerTags",
    ),
    needCounts: countCollabTags(
      matchShops(shops, filters, "needs"),
      "needTags",
    ),
  };
}
