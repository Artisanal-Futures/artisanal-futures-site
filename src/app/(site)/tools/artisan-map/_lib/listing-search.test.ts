/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MapShopMatch } from "~/lib/search/map-listing-types";

import {
  countCategories,
  mapCategoryContext,
  mapSearchInput,
  rankShopsByMatch,
} from "./listing-search";
import { mapShop } from "./test-shop";

describe("mapSearchInput", () => {
  it("is off with no category and under two characters", () => {
    assert.equal(mapSearchInput("", null), null);
    assert.equal(mapSearchInput("   ", null), null);
    assert.equal(mapSearchInput("a", null), null);
    assert.equal(mapSearchInput(" a ", null), null);
  });

  it("trims the query and omits absent keys, so cache keys match", () => {
    assert.deepEqual(mapSearchInput("  mug ", null), { q: "mug" });
    assert.deepEqual(mapSearchInput("", "Candles"), { category: "Candles" });
    assert.deepEqual(mapSearchInput("mug", "Candles"), {
      q: "mug",
      category: "Candles",
    });
  });

  it("keeps a short query alongside a category", () => {
    assert.deepEqual(mapSearchInput("a", "Candles"), {
      q: "a",
      category: "Candles",
    });
  });

  it("treats a blank category as none", () => {
    assert.equal(mapSearchInput("a", "  "), null);
    assert.deepEqual(mapSearchInput("mug", "  "), { q: "mug" });
  });
});

describe("mapCategoryContext", () => {
  const tree = [
    { name: "Home", children: [{ name: "Candles" }, { name: "Pottery" }] },
    { name: "Toys", children: [] },
  ];

  it("includes a parent's children", () => {
    assert.deepEqual(
      [...(mapCategoryContext(tree, "Home").categoryScope ?? [])],
      ["Home", "Candles", "Pottery"],
    );
  });

  it("scopes a child to itself, case-insensitively", () => {
    assert.deepEqual(
      [...(mapCategoryContext(tree, " candles ").categoryScope ?? [])],
      ["Candles"],
    );
  });

  it("gives a null scope for unknown or missing categories", () => {
    assert.equal(mapCategoryContext(tree, "Nope").categoryScope, null);
    assert.equal(mapCategoryContext(tree, null).categoryScope, null);
  });

  it("maps every child to its parent", () => {
    const { categoryParents } = mapCategoryContext(tree, null);
    assert.equal(categoryParents.get("Pottery"), "Home");
    assert.equal(categoryParents.get("Home"), undefined);
  });
});

describe("rankShopsByMatch", () => {
  const match = (shopId: string, score: number): [string, MapShopMatch] => [
    shopId,
    {
      shopId,
      score,
      items: [],
      total: 0,
      shopMatch: "none",
      categories: [],
    },
  ];
  const shops = ["a", "b", "c", "d"].map((id) => mapShop({ id }));
  const ids = (list: { id: string }[]) => list.map((shop) => shop.id);

  it("orders by score, leaving local-only matches last in name order", () => {
    const matches = new Map([match("c", 40), match("b", 90)]);
    assert.deepEqual(ids(rankShopsByMatch(shops, matches)), [
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("keeps name order for ties, as when browsing a category", () => {
    const matches = new Map([match("c", 0), match("a", 0)]);
    assert.deepEqual(ids(rankShopsByMatch(shops, matches)), [
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("returns a copy in the same order without matches", () => {
    const ranked = rankShopsByMatch(shops, null);
    assert.deepEqual(ids(ranked), ["a", "b", "c", "d"]);
    assert.notEqual(ranked, shops);
  });
});

describe("countCategories", () => {
  const parents = new Map([
    ["Candles", "Home"],
    ["Pottery", "Home"],
  ]);

  it("counts a shop once under a parent with several children", () => {
    const counts = countCategories(
      [mapShop({ categories: ["Candles", "Pottery"] })],
      parents,
    );
    assert.equal(counts.get("Home"), 1);
    assert.equal(counts.get("Candles"), 1);
  });

  it("uses the given accessor", () => {
    const counts = countCategories(
      [mapShop({ categories: ["Candles"] })],
      parents,
      () => ["Toys"],
    );
    assert.equal(counts.get("Toys"), 1);
    assert.equal(counts.get("Candles"), undefined);
  });
});
