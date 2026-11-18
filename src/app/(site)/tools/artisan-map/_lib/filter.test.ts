/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MapFilterContext, MapFilters } from "./filter";
import type { MapShopCollab } from "./types";
import type { MapShopMatch } from "~/lib/search/map-listing-types";

import { filterMapShops, hasActiveFilters, matchShops } from "./filter";
import { mapShop, TEST_SLUGS } from "./test-shop";

const NO_FILTERS: MapFilters = {
  query: "",
  attributes: [],
  inPerson: false,
  sectors: [],
  collab: false,
  offers: [],
  needs: [],
  category: null,
};

const shops = [
  mapShop({
    id: "a",
    name: "Bread Co",
    sector: "food-land",
    precision: "exact",
    attributeTags: ["Black Owned"],
  }),
  mapShop({
    id: "b",
    name: "apron works",
    sector: "clothing-adornment",
    attributeTags: ["Woman Owned"],
  }),
  mapShop({
    id: "c",
    name: "Clay Studio",
    sector: "art-culture",
    precision: "exact",
    attributeTags: ["Black Owned", "Woman Owned"],
    locality: "Detroit, MI",
  }),
];

const ids = (list: { id: string }[]) => list.map((s) => s.id);

describe("matchShops", () => {
  it("returns every shop without filters", () => {
    assert.deepEqual(ids(matchShops(shops, NO_FILTERS)), ["a", "b", "c"]);
  });

  it("matches the query against name and locality, case-insensitively", () => {
    assert.deepEqual(
      ids(matchShops(shops, { ...NO_FILTERS, query: "  DETROIT " })),
      ["c"],
    );
  });

  it("ANDs filters and ORs within a facet", () => {
    const filters: MapFilters = {
      ...NO_FILTERS,
      inPerson: true,
      sectors: ["food-land", "clothing-adornment"],
    };
    assert.deepEqual(ids(matchShops(shops, filters)), ["a"]);
  });

  it("can ignore one filter", () => {
    const filters: MapFilters = {
      ...NO_FILTERS,
      sectors: ["clothing-adornment"],
    };
    assert.deepEqual(ids(matchShops(shops, filters, "sectors")), [
      "a",
      "b",
      "c",
    ]);
  });
});

describe("filterMapShops", () => {
  it("sorts results by name, case-insensitively", () => {
    assert.deepEqual(ids(filterMapShops(shops, NO_FILTERS, TEST_SLUGS).shops), [
      "b",
      "a",
      "c",
    ]);
  });

  it("counts sectors ignoring the sector filter", () => {
    const result = filterMapShops(
      shops,
      { ...NO_FILTERS, sectors: ["clothing-adornment"] },
      TEST_SLUGS,
    );
    assert.deepEqual(ids(result.shops), ["b"]);
    assert.equal(result.sectorCounts.get("food-land"), 1);
    assert.equal(result.sectorCounts.get("art-culture"), 1);
    // The sector filter still narrows the attribute counts.
    assert.equal(result.attributeCounts.get("Black Owned"), 0);
    assert.equal(result.attributeCounts.get("Woman Owned"), 1);
  });

  it("counts attributes ignoring the attribute filter", () => {
    const result = filterMapShops(
      shops,
      { ...NO_FILTERS, attributes: ["Black Owned"] },
      TEST_SLUGS,
    );
    assert.deepEqual(ids(result.shops), ["a", "c"]);
    assert.equal(result.attributeCounts.get("Woman Owned"), 2);
    assert.equal(result.sectorCounts.get("clothing-adornment"), 0);
  });
});

describe("collaboration filters", () => {
  const collab = (
    offerTags: MapShopCollab["offerTags"],
    needTags: MapShopCollab["needTags"],
  ): MapShopCollab => ({ offerTags, needTags, offers: null, needs: null });

  const collabShops = [
    mapShop({
      id: "d",
      name: "Delivery Co",
      sector: "other",
      collab: collab(["Local delivery"], ["Storage space"]),
    }),
    mapShop({
      id: "e",
      name: "Event Space",
      sector: "art-culture",
      collab: collab(["Retail or event space", "Local delivery"], []),
    }),
    mapShop({
      id: "f",
      name: "Farm Stand",
      sector: "food-land",
      collab: collab([], ["Local delivery", "Storage space"]),
    }),
    mapShop({ id: "g", name: "Glass Works", sector: "art-culture" }),
  ];

  it("collab=1 keeps only shops with a listing", () => {
    assert.deepEqual(
      ids(matchShops(collabShops, { ...NO_FILTERS, collab: true })),
      ["d", "e", "f"],
    );
  });

  it("ORs within offers, and ANDs offers with needs", () => {
    assert.deepEqual(
      ids(
        matchShops(collabShops, {
          ...NO_FILTERS,
          offers: ["Local delivery", "Referrals"],
        }),
      ),
      ["d", "e"],
    );
    assert.deepEqual(
      ids(
        matchShops(collabShops, {
          ...NO_FILTERS,
          offers: ["Local delivery"],
          needs: ["Storage space"],
        }),
      ),
      ["d"],
    );
  });

  it("composes with the other filters", () => {
    assert.deepEqual(
      ids(
        matchShops(collabShops, {
          ...NO_FILTERS,
          collab: true,
          sectors: ["art-culture"],
        }),
      ),
      ["e"],
    );
  });

  it("counts each facet ignoring its own selection", () => {
    const result = filterMapShops(
      collabShops,
      {
        ...NO_FILTERS,
        offers: ["Local delivery"],
        needs: ["Storage space"],
      },
      TEST_SLUGS,
    );
    assert.deepEqual(ids(result.shops), ["d"]);
    // Offer counts ignore `offers` but respect `needs` (d and f).
    assert.equal(result.offerCounts.get("Local delivery"), 1);
    assert.equal(result.offerCounts.get("Retail or event space"), 0);
    // Need counts ignore `needs` but respect `offers` (d and e).
    assert.equal(result.needCounts.get("Storage space"), 1);
    assert.equal(result.needCounts.get("Local delivery"), 0);
    assert.equal(result.collabCount, 1);
  });

  it("counts open-to-collaborate shops ignoring the switch", () => {
    const result = filterMapShops(
      collabShops,
      { ...NO_FILTERS, collab: true, sectors: ["art-culture"] },
      TEST_SLUGS,
    );
    assert.equal(result.collabCount, 1);
    assert.equal(result.needCounts.get("Storage space"), 0);
    assert.equal(result.offerCounts.get("Local delivery"), 1);
  });
});

describe("listing search context", () => {
  const match = (
    shopId: string,
    overrides: Partial<MapShopMatch> = {},
  ): [string, MapShopMatch] => [
    shopId,
    {
      shopId,
      score: 10,
      items: [],
      total: 0,
      shopMatch: "none",
      categories: [],
      ...overrides,
    },
  ];

  const context = (
    entries: [string, MapShopMatch][] | null,
    categoryScope: string[] | null = null,
  ): MapFilterContext => ({
    matches: entries ? new Map(entries) : null,
    categoryScope: categoryScope ? new Set(categoryScope) : null,
    categoryParents: new Map([
      ["Candles", "Home"],
      ["Pottery", "Home"],
    ]),
  });

  const catalog = [
    mapShop({ id: "wax", name: "Wax Barn", categories: ["Candles", "Toys"] }),
    mapShop({ id: "clay", name: "Clay Barn", categories: ["Pottery"] }),
    mapShop({ id: "soap", name: "Soap Works", categories: ["Candles"] }),
  ];

  const search = { ...NO_FILTERS, query: "taper" };

  it("keeps a shop the server matched and drops the rest", () => {
    assert.deepEqual(
      ids(matchShops(catalog, search, undefined, context([match("wax")]))),
      ["wax"],
    );
  });

  it("still unions the local shop match with server matches", () => {
    const result = matchShops(
      catalog,
      { ...NO_FILTERS, query: "soap" },
      undefined,
      context([match("wax")]),
    );
    assert.deepEqual(ids(result), ["wax", "soap"]);
  });

  it("falls back to the local match with no server response", () => {
    assert.deepEqual(
      ids(
        matchShops(
          catalog,
          { ...NO_FILTERS, query: "clay" },
          undefined,
          context(null),
        ),
      ),
      ["clay"],
    );
  });

  it("filters by category scope, with no search", () => {
    const filters = { ...NO_FILTERS, category: "Home" };
    assert.deepEqual(
      ids(
        matchShops(
          catalog,
          filters,
          undefined,
          context(null, ["Home", "Candles", "Pottery"]),
        ),
      ),
      ["wax", "clay", "soap"],
    );
    assert.deepEqual(
      ids(matchShops(catalog, filters, undefined, context(null, ["Pottery"]))),
      ["clay"],
    );
  });

  it("ignores a category with no resolved scope", () => {
    assert.deepEqual(
      ids(matchShops(catalog, { ...NO_FILTERS, category: "Nope" })),
      ["wax", "clay", "soap"],
    );
  });

  it("tests a listing-only match against what matched, not the whole shop", () => {
    const result = matchShops(
      catalog,
      { ...search, category: "Candles" },
      undefined,
      context([match("wax", { categories: ["Toys"] })], ["Candles"]),
    );
    assert.deepEqual(ids(result), []);

    const inScope = matchShops(
      catalog,
      { ...search, category: "Candles" },
      undefined,
      context([match("wax", { categories: ["Candles"] })], ["Candles"]),
    );
    assert.deepEqual(ids(inScope), ["wax"]);
  });

  it("tests a shop-level match against the shop's categories", () => {
    for (const shopMatch of ["identity", "profile"] as const) {
      const result = matchShops(
        catalog,
        { ...search, category: "Candles" },
        undefined,
        context(
          [match("wax", { shopMatch, categories: ["Toys"] })],
          ["Candles"],
        ),
      );
      assert.deepEqual(ids(result), ["wax"]);
    }
  });

  it("treats a local name match as shop-level under a category", () => {
    const result = matchShops(
      catalog,
      { ...NO_FILTERS, query: "wax", category: "Candles" },
      undefined,
      context([match("wax", { categories: ["Toys"] })], ["Candles"]),
    );
    assert.deepEqual(ids(result), ["wax"]);
  });

  it("counts categories ignoring the category filter, rolling up to parents", () => {
    const result = filterMapShops(
      catalog,
      { ...NO_FILTERS, category: "Pottery" },
      TEST_SLUGS,
      context(null, ["Pottery"]),
    );
    assert.deepEqual(ids(result.shops), ["clay"]);
    assert.equal(result.categoryCounts.get("Candles"), 2);
    assert.equal(result.categoryCounts.get("Pottery"), 1);
    // One shop per parent, however many of its children the shop lists.
    assert.equal(result.categoryCounts.get("Home"), 3);
    assert.equal(result.categoryCounts.get("Toys"), 1);
  });

  it("counts a listing-only match under what matched", () => {
    const result = filterMapShops(
      catalog,
      search,
      TEST_SLUGS,
      context([match("wax", { categories: ["Toys"] })]),
    );
    assert.equal(result.categoryCounts.get("Toys"), 1);
    assert.equal(result.categoryCounts.get("Candles"), undefined);
  });

  it("other facets respect the category filter", () => {
    const tagged = [
      mapShop({
        id: "a",
        categories: ["Candles"],
        attributeTags: ["Black Owned"],
      }),
      mapShop({
        id: "b",
        categories: ["Toys"],
        attributeTags: ["Black Owned"],
      }),
    ];
    const result = filterMapShops(
      tagged,
      { ...NO_FILTERS, category: "Candles" },
      TEST_SLUGS,
      context(null, ["Candles"]),
    );
    assert.equal(result.attributeCounts.get("Black Owned"), 1);
  });
});

describe("hasActiveFilters", () => {
  it("is false for defaults and a blank query", () => {
    assert.equal(hasActiveFilters(NO_FILTERS), false);
    assert.equal(hasActiveFilters({ ...NO_FILTERS, query: "   " }), false);
  });

  it("is true for any active filter", () => {
    assert.equal(hasActiveFilters({ ...NO_FILTERS, inPerson: true }), true);
    assert.equal(hasActiveFilters({ ...NO_FILTERS, sectors: ["other"] }), true);
    assert.equal(hasActiveFilters({ ...NO_FILTERS, collab: true }), true);
    assert.equal(
      hasActiveFilters({ ...NO_FILTERS, category: "Candles" }),
      true,
    );
    assert.equal(
      hasActiveFilters({ ...NO_FILTERS, needs: ["Referrals"] }),
      true,
    );
  });
});
