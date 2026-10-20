import { useMemo } from "react";
import { matchSorter, rankings } from "match-sorter";

/** Cards rendered per "Show more" step. */
export const PAGE_SIZE = 24;
/** Shops with this many items or fewer skip search/filter/sort entirely. */
export const CONTROLS_THRESHOLD = 12;

export const SORT_OPTIONS = [
  "featured",
  "name",
  "price-asc",
  "price-desc",
  "newest",
] as const;
export type CatalogSort = (typeof SORT_OPTIONS)[number];
export const DEFAULT_SORT: CatalogSort = "featured";

export const isCatalogSort = (value: string | null): value is CatalogSort =>
  SORT_OPTIONS.includes(value as CatalogSort);

/** The fields shared by products and services that the catalog relies on. */
type CatalogItem = {
  name: string;
  priceInCents: number | null;
  isFeatured: boolean;
  // A Date on the server, a string if it was ever serialized without superjson.
  createdAt: Date | string;
  categories: { name: string }[];
};

type Options = {
  query: string;
  /** A category name, or "" for all. Unknown names are ignored. */
  category: string;
  sort: CatalogSort;
  visibleCount: number;
};

const byName = (a: CatalogItem, b: CatalogItem) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

const stripHtml = (html?: string | null) =>
  (html ?? "").replace(/<[^>]*>/g, " ");

const toTime = (value: Date | string) => new Date(value).getTime();

const comparators: Record<
  CatalogSort,
  (a: CatalogItem, b: CatalogItem) => number
> = {
  featured: (a, b) =>
    Number(b.isFeatured) - Number(a.isFeatured) || byName(a, b),
  name: byName,
  // Items without a price always sink to the bottom, in either direction.
  "price-asc": (a, b) =>
    (a.priceInCents ?? Infinity) === (b.priceInCents ?? Infinity)
      ? byName(a, b)
      : (a.priceInCents ?? Infinity) - (b.priceInCents ?? Infinity),
  "price-desc": (a, b) =>
    (a.priceInCents ?? -Infinity) === (b.priceInCents ?? -Infinity)
      ? byName(a, b)
      : (b.priceInCents ?? -Infinity) - (a.priceInCents ?? -Infinity),
  newest: (a, b) => toTime(b.createdAt) - toTime(a.createdAt) || byName(a, b),
};

/**
 * Client-side search, category filter, sort and progressive paging for a
 * shop's products or services. Everything is already loaded, so this only
 * reshapes the list.
 */
export function useShopCatalog<T extends CatalogItem>(
  items: T[],
  { query, category, sort, visibleCount }: Options,
) {
  // Counted from the unfiltered list so the chips don't shift while filtering.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      // A category can only count once per item.
      for (const name of new Set(item.categories.map((c) => c.name))) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [items]);

  const matches = useMemo(() => {
    const activeCategory = categories.some((c) => c.name === category)
      ? category
      : null;
    const inCategory = activeCategory
      ? items.filter((item) =>
          item.categories.some((c) => c.name === activeCategory),
        )
      : items;

    const trimmed = query.trim();
    if (trimmed) {
      // Keep matchSorter's relevance order unless a sort was picked on purpose.
      const searched = matchSorter(inCategory, trimmed, {
        keys: [
          "name",
          "categories.*.name",
          "tags",
          "attributeTags",
          // Services have no materialTags; matchSorter skips missing keys.
          "materialTags",
          // Descriptions are stored as rich text; don't match on the markup.
          (item: T) =>
            stripHtml((item as { description?: string | null }).description),
        ],
        threshold: rankings.CONTAINS,
      });
      return sort === DEFAULT_SORT
        ? searched
        : [...searched].sort(comparators[sort]);
    }

    return [...inCategory].sort(comparators[sort]);
  }, [items, categories, query, category, sort]);

  const visible = useMemo(
    () => matches.slice(0, visibleCount),
    [matches, visibleCount],
  );

  return { visible, totalMatches: matches.length, categories };
}
