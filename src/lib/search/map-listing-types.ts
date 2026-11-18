/**
 * The Artisan Map's listing search response. Types only (plus one input limit),
 * so client code can import this without pulling in the search module.
 */

/** Longest accepted `category` input, shared by the router and the URL parser. */
export const MAX_CATEGORY_LENGTH = 120;

export type MapMatchedItem = {
  kind: "product" | "service";
  id: string;
  name: string;
};

export type MapShopMatch = {
  shopId: string;
  /** Best in-scope item or shop-level score; 0 when browsing a category. */
  score: number;
  /** Best first (name order when browsing), capped, scoped to the category. */
  items: MapMatchedItem[];
  /** Matched items in the category scope, including those past the cap. */
  total: number;
  /** "profile" when the only shop-level hit was the bio or description. */
  shopMatch: "none" | "identity" | "profile";
  /** Category names across every query-matched item, ignoring the category. */
  categories: string[];
};

export type MapSearchResponse = {
  /** The query actually applied, after trimming and truncation. */
  query: string;
  matches: MapShopMatch[];
  isFuzzy: boolean;
  /** True when part of the catalog went unsearched (candidate cap). */
  truncated: boolean;
};
