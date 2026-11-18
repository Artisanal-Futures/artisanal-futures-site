/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  MapListingSearchInput,
  MapSearchItem,
  MapSearchShop,
} from "./map-listing-search";

import { mapListingWhere, searchMapListings } from "./map-listing-search";

const item = (overrides: Partial<MapSearchItem> = {}): MapSearchItem => ({
  kind: "product",
  id: "item",
  name: "Lamp",
  description: "",
  shopId: "s1",
  categories: [],
  ...overrides,
});

const shop = (overrides: Partial<MapSearchShop> = {}): MapSearchShop => ({
  id: "s1",
  name: "Fernwood",
  ownerName: "Ada",
  locality: null,
  attributeTags: [],
  bio: null,
  description: null,
  ...overrides,
});

const search = (input: Partial<MapListingSearchInput>) =>
  searchMapListings({
    query: "",
    categoryNames: null,
    items: [],
    shops: [shop()],
    truncated: false,
    ...input,
  });

const named = (names: string[], overrides: Partial<MapSearchItem> = {}) =>
  names.map((name, index) => item({ id: `i${index}`, name, ...overrides }));

describe("mapListingWhere", () => {
  it("requires a public item on a visible shop", () => {
    assert.deepEqual(mapListingWhere.AND[0], { isPublic: true });
    assert.deepEqual(mapListingWhere.AND[2], { shopId: { not: null } });
  });
});

describe("searchMapListings: item matches", () => {
  it("returns matched items, echoing the query", () => {
    const result = search({
      query: "wallet",
      items: [item({ id: "w", name: "Leather Wallet", kind: "service" })],
    });
    assert.equal(result.query, "wallet");
    assert.equal(result.isFuzzy, false);
    assert.deepEqual(result.matches[0]?.items, [
      { kind: "service", id: "w", name: "Leather Wallet" },
    ]);
    assert.equal(result.matches[0]?.total, 1);
    assert.equal(result.matches[0]?.shopMatch, "none");
  });

  it("matches tags and categories", () => {
    for (const row of [
      item({ tags: ["Wallet"] }),
      item({ categories: [{ name: "Wallets" }] }),
    ]) {
      assert.equal(
        search({ query: "wallet", items: [row] }).matches[0]?.total,
        1,
      );
    }
  });

  it("does not count an item that matched only on shop text", () => {
    const result = search({
      query: "fernwood",
      items: [item({ id: "plain", name: "Lamp" })],
    });
    assert.equal(result.matches.length, 1);
    assert.deepEqual(result.matches[0]?.items, []);
    assert.equal(result.matches[0]?.total, 0);
    assert.equal(result.matches[0]?.shopMatch, "identity");
  });

  it("still counts an item whose own text repeats the shop name", () => {
    const result = search({
      query: "fernwood",
      items: [
        item({ id: "own", name: "Lamp", description: "A fernwood lamp" }),
      ],
    });
    assert.equal(result.matches[0]?.total, 1);
  });

  it("lets a query cross item and shop fields", () => {
    const result = search({
      query: "wallet detroit",
      shops: [shop({ locality: "Detroit, MI" })],
      items: [
        item({ id: "w", name: "Wallet" }),
        item({ id: "l", name: "Lamp" }),
      ],
    });
    assert.deepEqual(
      result.matches[0]?.items.map((entry) => entry.id),
      ["w"],
    );
  });

  it("caps items at five, best first, and still totals all of them", () => {
    const rows = [
      ...named(["Tray", "Rack", "Stand", "Box", "Jar", "Tin"], {
        description: "for a wallet",
      }),
      item({ id: "best", name: "Wallet" }),
    ];
    const [match] = search({ query: "wallet", items: rows }).matches;
    assert.equal(match?.items.length, 5);
    assert.equal(match?.items[0]?.id, "best");
    assert.equal(match?.total, 7);
  });
});

describe("searchMapListings: shop score", () => {
  it("takes the maximum, never a sum, so a big catalog can't win", () => {
    const result = search({
      query: "wallet",
      shops: [shop({ id: "big" }), shop({ id: "small" })],
      items: [
        ...named(["Tray", "Rack", "Stand", "Box", "Jar", "Tin"], {
          description: "for a wallet",
          shopId: "big",
        }),
        item({ id: "exact", name: "Wallet", shopId: "small" }),
      ],
    });
    assert.deepEqual(
      result.matches.map((match) => match.shopId),
      ["small", "big"],
    );
    assert.equal(result.matches[1]?.score, 4);
  });

  it("uses the shop-level score when it beats the items", () => {
    const result = search({
      query: "fernwood",
      items: [item({ description: "fernwood" })],
    });
    assert.ok((result.matches[0]?.score ?? 0) >= 100);
  });
});

describe("searchMapListings: shop-level matches", () => {
  it("reports identity for name, owner, locality and attributes", () => {
    const cases: [string, Partial<MapSearchShop>][] = [
      ["fernwood", {}],
      ["ada", {}],
      ["detroit", { locality: "Detroit, MI" }],
      ["queer", { attributeTags: ["Queer Owned"] }],
    ];
    for (const [query, fields] of cases) {
      const result = search({ query, shops: [shop(fields)] });
      assert.equal(result.matches[0]?.shopMatch, "identity", query);
    }
  });

  it("reports profile when only the bio or description matched", () => {
    for (const profile of [
      { bio: "We throw bowls" },
      { description: "<p>We throw <b>bowls</b></p>" },
    ]) {
      const result = search({ query: "bowls", shops: [shop(profile)] });
      assert.equal(result.matches[0]?.shopMatch, "profile");
      assert.deepEqual(result.matches[0]?.items, []);
    }
  });

  it("drops the import placeholder from profiles and listings", () => {
    const placeholder = "No description available";
    const result = search({
      query: "available",
      shops: [shop({ bio: placeholder, description: placeholder })],
      items: [item({ description: placeholder })],
    });
    assert.deepEqual(result.matches, []);
  });

  it("does not match markup", () => {
    const result = search({
      query: "div",
      shops: [shop({ bio: '<div class="x">Hello</div>' })],
      items: [item({ description: "<div>Hello</div>" })],
    });
    assert.deepEqual(result.matches, []);
  });

  it("does not expose profile text in the response", () => {
    const result = search({ query: "bowls", shops: [shop({ bio: "bowls" })] });
    assert.ok(!JSON.stringify(result).includes("throw"));
    assert.deepEqual(Object.keys(result.matches[0] ?? {}).sort(), [
      "categories",
      "items",
      "score",
      "shopId",
      "shopMatch",
      "total",
    ]);
  });
});

describe("searchMapListings: unusable queries", () => {
  it("returns nothing for all-short tokens, even with a category", () => {
    const items = [item({ categories: [{ name: "Candles" }] })];
    assert.deepEqual(search({ query: "a b", items }).matches, []);
    assert.deepEqual(
      search({ query: "a b", items, categoryNames: ["Candles"] }).matches,
      [],
    );
  });

  it("returns nothing for a blank query with no category", () => {
    assert.deepEqual(search({ query: "  ", items: [item()] }).matches, []);
  });

  it("passes truncated through", () => {
    assert.equal(search({ query: "a b", truncated: true }).truncated, true);
  });
});

describe("searchMapListings: fuzzy", () => {
  it("runs only when both strict passes are empty, below strict scores", () => {
    const result = search({
      query: "wallt",
      items: [item({ name: "Wallet" })],
    });
    assert.equal(result.isFuzzy, true);
    const score = result.matches[0]?.score ?? 0;
    assert.ok(score > 0 && score <= 1);
  });

  it("does not run when a strict pass found something", () => {
    const result = search({
      query: "fernwood",
      items: [item({ name: "Fernwod" })],
    });
    assert.equal(result.isFuzzy, false);
    assert.equal(result.matches[0]?.total, 0);
  });

  it("does not let a shop-name typo match all its items", () => {
    const result = search({
      query: "fernwod",
      items: [item({ name: "Lamp" }), item({ id: "b", name: "Rug" })],
    });
    assert.deepEqual(result.matches, []);
    assert.equal(result.isFuzzy, false);
  });
});

describe("searchMapListings: category scope", () => {
  const items = [
    item({
      id: "candle",
      name: "Wallet Candle",
      categories: [{ name: "Candles" }],
    }),
    item({ id: "toy", name: "Wallet Toy", categories: [{ name: "Toys" }] }),
  ];

  it("scopes items and total, case-insensitively", () => {
    const [match] = search({
      query: "wallet",
      items,
      categoryNames: ["CANDLES"],
    }).matches;
    assert.deepEqual(
      match?.items.map((entry) => entry.id),
      ["candle"],
    );
    assert.equal(match?.total, 1);
  });

  it("reports categories across every matched item regardless of scope", () => {
    const [match] = search({
      query: "wallet",
      items,
      categoryNames: ["Candles"],
    }).matches;
    assert.deepEqual(match?.categories, ["Candles", "Toys"]);
  });

  it("keeps out-of-scope matches so other categories can be counted", () => {
    const [match] = search({
      query: "wallet",
      items: items.slice(1),
      categoryNames: ["Candles"],
    }).matches;
    assert.deepEqual(match?.items, []);
    assert.deepEqual(match?.categories, ["Toys"]);
    assert.equal(match?.score, 0);
  });

  it("scores a shop on in-scope items only", () => {
    const [match] = search({
      query: "wallet",
      items: [
        item({ id: "a", name: "Wallet", categories: [{ name: "Toys" }] }),
        item({
          id: "b",
          name: "Tray",
          description: "a wallet",
          categories: [{ name: "Candles" }],
        }),
      ],
      categoryNames: ["Candles"],
    }).matches;
    assert.equal(match?.score, 4);
  });
});

describe("searchMapListings: browsing a category", () => {
  it("lists in-category items in name order, without scores", () => {
    const result = search({
      categoryNames: ["Candles", "Tapers"],
      items: [
        item({ id: "z", name: "Zinnia", categories: [{ name: "Candles" }] }),
        item({ id: "a", name: "Amber", categories: [{ name: "Tapers" }] }),
        item({ id: "x", name: "Rug", categories: [{ name: "Toys" }] }),
      ],
    });
    assert.deepEqual(
      result.matches[0]?.items.map((entry) => entry.id),
      ["a", "z"],
    );
    assert.equal(result.matches[0]?.total, 2);
    assert.equal(result.matches[0]?.score, 0);
    assert.equal(result.matches[0]?.shopMatch, "none");
    assert.equal(result.isFuzzy, false);
  });

  it("caps items at five and totals all of them", () => {
    const [match] = search({
      categoryNames: ["Candles"],
      items: named(["A", "B", "C", "D", "E", "F"], {
        categories: [{ name: "Candles" }],
      }),
    }).matches;
    assert.equal(match?.items.length, 5);
    assert.equal(match?.total, 6);
  });
});
