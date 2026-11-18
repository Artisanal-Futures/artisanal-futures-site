import type { ScoredRow, SearchableRow } from "~/lib/search/catalog-search";
import type {
  MapMatchedItem,
  MapSearchResponse,
  MapShopMatch,
} from "~/lib/search/map-listing-types";
import {
  scoreCatalog,
  scoreFuzzy,
  tokenize,
} from "~/lib/search/catalog-search";
import { fromVisibleShop } from "~/server/api/shared/visibility";
import { plainOrNull } from "~/server/shop-profile/text";

/** Listings the map may search or open: public, on a visible shop, not shopless. */
export const mapListingWhere = {
  AND: [{ isPublic: true }, fromVisibleShop, { shopId: { not: null } }],
};

export type MapSearchItem = SearchableRow & {
  kind: MapMatchedItem["kind"];
  categories: { name: string }[];
};

export type MapSearchShop = {
  id: string;
  name: string;
  ownerName: string;
  locality: string | null;
  attributeTags: string[];
  bio: string | null;
  description: string | null;
};

export type MapListingSearchInput = {
  query: string;
  /** Resolved names, parent and children; null means no category scope. */
  categoryNames: readonly string[] | null;
  items: MapSearchItem[];
  shops: MapSearchShop[];
  truncated: boolean;
};

const MAX_ITEMS_PER_SHOP = 5;

/** `plainOrNull` requires a limit; this one is past any real profile or listing. */
const MATCH_TEXT_MAX_CHARS = 20_000;

type ShopHit = Pick<MapShopMatch, "score" | "shopMatch">;

const plainText = (raw: string | null | undefined) =>
  plainOrNull(raw, MATCH_TEXT_MAX_CHARS) ?? "";

/** One row per shop for what the shop itself says, kept apart from its items. */
function scoreShops(shops: MapSearchShop[], query: string) {
  const rows = shops.map(
    (shop): SearchableRow => ({
      id: shop.id,
      name: shop.name,
      description: `${plainText(shop.bio)} ${plainText(shop.description)}`,
      shopId: shop.id,
      attributeTags: shop.attributeTags,
      shopContext: `${shop.ownerName} ${shop.locality ?? ""}`,
    }),
  );

  const hits = new Map<string, ShopHit>();
  for (const { row, score, reasons } of scoreCatalog(rows, query)) {
    const profileOnly = reasons.length === 1 && reasons[0] === "description";
    hits.set(row.id, {
      score,
      shopMatch: profileOnly ? "profile" : "identity",
    });
  }
  return hits;
}

/** Folds scored items into per-shop matches. `scored` must be best first. */
function toShopMatches(
  scored: ScoredRow<MapSearchItem>[],
  shopHits: ReadonlyMap<string, ShopHit>,
  inScope: (item: MapSearchItem) => boolean,
): MapShopMatch[] {
  const entries = new Map<
    string,
    Omit<MapShopMatch, "categories"> & { categories: Set<string> }
  >();

  const entryFor = (shopId: string) => {
    let entry = entries.get(shopId);
    if (!entry) {
      const hit = shopHits.get(shopId);
      entry = {
        shopId,
        score: hit?.score ?? 0,
        items: [],
        total: 0,
        shopMatch: hit?.shopMatch ?? "none",
        categories: new Set(),
      };
      entries.set(shopId, entry);
    }
    return entry;
  };

  for (const shopId of shopHits.keys()) entryFor(shopId);

  for (const { row, score } of scored) {
    if (!row.shopId) continue;
    const entry = entryFor(row.shopId);
    for (const category of row.categories) entry.categories.add(category.name);
    if (!inScope(row)) continue;

    // Never a sum, so a large catalog cannot win rank.
    entry.score = Math.max(entry.score, score);
    entry.total += 1;
    if (entry.items.length < MAX_ITEMS_PER_SHOP) {
      entry.items.push({ kind: row.kind, id: row.id, name: row.name });
    }
  }

  return [...entries.values()]
    .map((entry) => ({ ...entry, categories: [...entry.categories].sort() }))
    .sort((a, b) => b.score - a.score || a.shopId.localeCompare(b.shopId));
}

const byNameThenId = (a: MapSearchItem, b: MapSearchItem) =>
  a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

/**
 * Per-shop matches for the Artisan Map. A blank query browses the category, in
 * name order. Pure: the router fetches `items` and `shops` and passes them in.
 *
 * Out-of-scope matches stay in the response, with empty `items`, so the map can
 * count other categories while one is selected.
 */
export function searchMapListings({
  query,
  categoryNames,
  items,
  shops,
  truncated,
}: MapListingSearchInput): MapSearchResponse {
  const scope = categoryNames
    ? new Set(categoryNames.map((name) => name.toLowerCase()))
    : null;
  const inScope = (item: MapSearchItem) =>
    !scope ||
    item.categories.some((category) => scope.has(category.name.toLowerCase()));
  const empty = { query, matches: [], isFuzzy: false, truncated };

  if (query.trim() === "") {
    if (!scope) return empty;
    const browsed = items
      .filter(inScope)
      .sort(byNameThenId)
      .map((row) => ({ row, score: 0, matchedAll: true, reasons: [] }));
    return { ...empty, matches: toShopMatches(browsed, new Map(), inScope) };
  }

  if (tokenize(query).length === 0) return empty;

  // Placeholder text and markup must not count as listing copy.
  const cleaned = items.map((item) => ({
    ...item,
    description: plainText(item.description),
  }));
  const shopById = new Map(shops.map((shop) => [shop.id, shop]));

  const rows = cleaned.map((item) => {
    const shop = item.shopId ? shopById.get(item.shopId) : undefined;
    return {
      ...item,
      // Lets "candle detroit" reach a candle in a Detroit shop.
      shopContext: shop
        ? `${shop.name} ${shop.ownerName} ${shop.locality ?? ""} ${shop.attributeTags.join(" ")}`
        : null,
    };
  });

  // A hit on shop text alone would return every item in "Candle Co" for "candle".
  const scored = scoreCatalog(rows, query).filter(({ reasons }) =>
    reasons.some((reason) => reason !== "shop"),
  );
  const shopHits = scoreShops(shops, query);

  if (scored.length > 0 || shopHits.size > 0) {
    return { ...empty, matches: toShopMatches(scored, shopHits, inScope) };
  }

  // Without shop context, so a typo of a shop name can't match all its items.
  const fuzzy = scoreFuzzy(cleaned, query);
  return {
    ...empty,
    matches: toShopMatches(fuzzy, new Map(), inScope),
    isFuzzy: fuzzy.length > 0,
  };
}
