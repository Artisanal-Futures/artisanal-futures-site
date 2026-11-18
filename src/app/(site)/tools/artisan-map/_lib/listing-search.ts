import type { MapFilterContext } from "./filter";
import type { MapShop } from "./types";
import type { MapShopMatch } from "~/lib/search/map-listing-types";

/** Below this, and without a category, only the local shop match runs. */
const MIN_QUERY_LENGTH = 2;

export type MapSearchInput = { q?: string; category?: string };

/**
 * Input for `shop.searchMapListings`, or null when search is off. Shared by the
 * page's prefetch and the client hook so their tRPC cache keys match.
 *
 * A short query stays in the input alongside a category: the server then
 * returns no matches, leaving the local match, rather than browsing the
 * category and letting every shop in it pass the search.
 */
export function mapSearchInput(
  q: string,
  category: string | null,
): MapSearchInput | null {
  const query = q.trim();
  const name = category?.trim();
  if (!name && query.length < MIN_QUERY_LENGTH) return null;
  return {
    ...(query ? { q: query } : {}),
    ...(name ? { category: name } : {}),
  };
}

type CategoryNode = { name: string; children: { name: string }[] };

/**
 * The category half of `MapFilterContext`, from the navigation tree. A parent
 * selects its children too, names match case-insensitively, and an unknown
 * value gives a null scope, so it filters nothing.
 */
export function mapCategoryContext(
  tree: readonly CategoryNode[],
  category: string | null,
): Pick<MapFilterContext, "categoryScope" | "categoryParents"> {
  const selected = category?.trim().toLowerCase();
  const categoryParents = new Map<string, string>();
  let categoryScope: Set<string> | null = null;

  for (const parent of tree) {
    if (parent.name.toLowerCase() === selected) {
      categoryScope = new Set([
        parent.name,
        ...parent.children.map((child) => child.name),
      ]);
    }
    for (const child of parent.children) {
      categoryParents.set(child.name, parent.name);
      if (child.name.toLowerCase() === selected) {
        categoryScope = new Set([child.name]);
      }
    }
  }

  return { categoryScope, categoryParents };
}

/**
 * Best match first, for the sidebar. The sort is stable, so ties and shops
 * only matched locally keep their incoming (name) order.
 */
export function rankShopsByMatch<T extends Pick<MapShop, "id">>(
  shops: readonly T[],
  matches: ReadonlyMap<string, MapShopMatch> | null,
): T[] {
  if (!matches) return [...shops];
  const score = (shop: T) => matches.get(shop.id)?.score ?? 0;
  return [...shops].sort((a, b) => score(b) - score(a));
}

/** Shops per category. A shop counts once under a parent, however many children. */
export function countCategories(
  shops: readonly MapShop[],
  categoryParents: ReadonlyMap<string, string>,
  categoriesOf: (shop: MapShop) => readonly string[] = (shop) =>
    shop.categories,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const shop of shops) {
    const names = new Set<string>();
    for (const name of categoriesOf(shop)) {
      names.add(name);
      const parent = categoryParents.get(name);
      if (parent) names.add(parent);
    }
    for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}
