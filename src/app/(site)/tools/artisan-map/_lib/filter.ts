import type { MapShop } from "./types";
import type { MapUrlState } from "./url-state";
import type { CollaborationTag } from "~/lib/constants/collaboration-tags";
import type { MapShopMatch } from "~/lib/search/map-listing-types";

import { countCollabTags } from "./collab";
import { countCategories } from "./listing-search";
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
  | "category"
>;

type FilterKey = keyof MapFilters;
type ShopPredicate = (shop: MapShop) => boolean;

/** What the filters know beyond the shops: server search and the category tree. */
export type MapFilterContext = {
  /** Server matches by shop id; null when no search has settled. */
  matches: ReadonlyMap<string, MapShopMatch> | null;
  /** The selected category and its children; null when none or unknown. */
  categoryScope: ReadonlySet<string> | null;
  /** Child category name to parent name, so parents count their children. */
  categoryParents: ReadonlyMap<string, string>;
};

export const EMPTY_FILTER_CONTEXT: MapFilterContext = {
  matches: null,
  categoryScope: null,
  categoryParents: new Map(),
};

type FilterEnv = MapFilterContext & { needle: string };

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
  /** Per-category counts under every filter but `category`. */
  categoryCounts: Map<string, number>;
};

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

function matchesQuery(shop: MapShop, needle: string) {
  return [shop.name, shop.ownerName, shop.locality, ...shop.attributeTags].some(
    (field) => field?.toLowerCase().includes(needle),
  );
}

/**
 * The categories a shop answers for under the current search. A shop found only
 * through its listings answers for what matched: searching "candle" with "Home"
 * selected must not keep a shop whose candles are elsewhere. A shop found by
 * name or profile answers for its whole catalog.
 */
function categoriesInSearch(shop: MapShop, { needle, matches }: FilterEnv) {
  const match = needle ? matches?.get(shop.id) : undefined;
  return match?.shopMatch === "none" && !matchesQuery(shop, needle)
    ? match.categories
    : shop.categories;
}

/** Builds each filter's predicate, or null when that filter is inactive. */
const FILTERS: {
  [K in FilterKey]: (
    value: MapFilters[K],
    env: FilterEnv,
  ) => ShopPredicate | null;
} = {
  query: (_query, { needle, matches }) =>
    needle
      ? (shop) => matchesQuery(shop, needle) || !!matches?.has(shop.id)
      : null,
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
  category: (category, env) => {
    const scope = env.categoryScope;
    return category && scope
      ? (shop) => categoriesInSearch(shop, env).some((name) => scope.has(name))
      : null;
  },
};

const filterEnv = (
  filters: MapFilters,
  context: MapFilterContext,
): FilterEnv => ({
  ...context,
  needle: filters.query.trim().toLowerCase(),
});

function predicatesFor(
  filters: MapFilters,
  ignore: FilterKey | undefined,
  context: MapFilterContext,
) {
  const env = filterEnv(filters, context);
  const predicates: ShopPredicate[] = [];
  for (const key of Object.keys(FILTERS) as FilterKey[]) {
    if (key === ignore) continue;
    // Each builder takes its own key's value; TS can't correlate the two.
    const build = FILTERS[key] as (
      value: MapFilters[FilterKey],
      env: FilterEnv,
    ) => ShopPredicate | null;
    const predicate = build(filters[key], env);
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
  context: MapFilterContext = EMPTY_FILTER_CONTEXT,
): MapShop[] {
  const predicates = predicatesFor(filters, ignore, context);
  if (predicates.length === 0) return shops;
  return shops.filter((shop) => predicates.every((p) => p(shop)));
}

/**
 * True when any filter (not just the facets) narrows the list. An unknown
 * category filters nothing but still counts, so "Clear filters" can remove it.
 */
export function hasActiveFilters(filters: MapFilters): boolean {
  return (
    !!filters.category ||
    predicatesFor(filters, undefined, EMPTY_FILTER_CONTEXT).length > 0
  );
}

const byName = (a: MapShop, b: MapShop) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/** The filtered, name-sorted shops plus each facet's counts. */
export function filterMapShops(
  shops: MapShop[],
  filters: MapFilters,
  sectorSlugs: readonly string[],
  context: MapFilterContext = EMPTY_FILTER_CONTEXT,
): MapFilterResult {
  const matching = (ignore?: FilterKey) =>
    matchShops(shops, filters, ignore, context);
  const env = filterEnv(filters, context);

  return {
    shops: [...matching()].sort(byName),
    attributeCounts: countAttributes(matching("attributes")),
    sectorCounts: countSectors(matching("sectors"), sectorSlugs),
    collabCount: matching("collab").filter((shop) => shop.collab !== null)
      .length,
    offerCounts: countCollabTags(matching("offers"), "offerTags"),
    needCounts: countCollabTags(matching("needs"), "needTags"),
    categoryCounts: countCategories(
      matching("category"),
      context.categoryParents,
      (shop) => categoriesInSearch(shop, env),
    ),
  };
}
