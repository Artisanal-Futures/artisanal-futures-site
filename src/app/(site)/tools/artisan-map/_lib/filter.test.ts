/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MapFilters } from "./filter";
import type { MapShopCollab } from "./types";

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
      hasActiveFilters({ ...NO_FILTERS, needs: ["Referrals"] }),
      true,
    );
  });
});
