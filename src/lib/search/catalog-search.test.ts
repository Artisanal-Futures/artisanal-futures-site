/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SearchableRow } from "./catalog-search";

import { scoreCatalog, scoreFuzzy, searchCatalog } from "./catalog-search";

const row = (overrides: Partial<SearchableRow> = {}): SearchableRow => ({
  id: "row",
  name: "Row",
  description: "",
  shopId: "shop",
  ...overrides,
});

const ids = (rows: SearchableRow[]) => rows.map((entry) => entry.id);

describe("searchCatalog", () => {
  const candidates = [
    row({ id: "desc", name: "Tray", description: "Holds a wallet" }),
    row({ id: "exact", name: "Wallet" }),
    row({ id: "other", name: "Lamp" }),
    row({ id: "prefix", name: "Wallet Chain", shopId: "shop-2" }),
  ];

  it("ranks strict matches and interleaves by shop", () => {
    assert.deepEqual(searchCatalog(candidates, "wallet"), {
      ranked: [candidates[1], candidates[3], candidates[0]],
      isFuzzy: false,
      appliedTerms: ["wallet"],
      suggestions: [],
    });
  });

  it("returns every candidate when no token is usable", () => {
    assert.deepEqual(searchCatalog(candidates, "a b"), {
      ranked: candidates,
      isFuzzy: false,
      appliedTerms: [],
      suggestions: [],
    });
  });

  it("flags the typo fallback as fuzzy", () => {
    const result = searchCatalog(candidates, "wallt");
    assert.equal(result.isFuzzy, true);
    assert.ok(ids(result.ranked).includes("exact"));
  });

  it("matches on the shop name and owner, as before", () => {
    const shopRow = row({
      id: "shop-hit",
      name: "Lamp",
      shop: { name: "Fernwood", ownerName: "Ada Lovell" },
    });
    assert.deepEqual(ids(searchCatalog([shopRow], "fernwood").ranked), [
      "shop-hit",
    ]);
    assert.deepEqual(ids(searchCatalog([shopRow], "lovell").ranked), [
      "shop-hit",
    ]);
  });
});

describe("scoreCatalog", () => {
  it("returns scores, best first", () => {
    const scored = scoreCatalog(
      [
        row({ id: "desc", name: "Tray", description: "Holds a wallet" }),
        row({ id: "exact", name: "Wallet" }),
      ],
      "wallet",
    );
    assert.deepEqual(
      scored.map((entry) => entry.row.id),
      ["exact", "desc"],
    );
    assert.ok((scored[0]?.score ?? 0) > (scored[1]?.score ?? 0));
    assert.deepEqual(scored[1]?.reasons, ["description"]);
  });

  it("matches nothing when no token is usable", () => {
    assert.deepEqual(scoreCatalog([row()], "a b"), []);
  });

  it("requires every token", () => {
    assert.deepEqual(
      scoreCatalog([row({ name: "Wallet" })], "wallet lamp"),
      [],
    );
  });

  it("reports every field a token was found in", () => {
    const [entry] = scoreCatalog(
      [row({ description: "A wallet", shopContext: "Wallet Barn" })],
      "wallet",
    );
    assert.deepEqual(entry?.reasons.sort(), ["description", "shop"]);
  });
});

describe("shopContext", () => {
  it("is scored as shop text and enables cross-field queries", () => {
    const [entry] = scoreCatalog(
      [row({ name: "Wallet", shopContext: "Detroit, MI" })],
      "wallet detroit",
    );
    assert.deepEqual(entry?.reasons.sort(), ["name", "shop"]);
  });

  it("matches on its own with only the shop reason", () => {
    const [entry] = scoreCatalog(
      [row({ name: "Lamp", shopContext: "Detroit, MI" })],
      "detroit",
    );
    assert.deepEqual(entry?.reasons, ["shop"]);
  });
});

describe("scoreFuzzy", () => {
  it("scores in (0, 1], best first, below any strict score", () => {
    const candidates = [
      row({ id: "a", name: "Wallet" }),
      row({ id: "b", name: "Wallet Chain" }),
    ];
    const scored = scoreFuzzy(candidates, "wallt");
    assert.ok(scored.length > 0);
    for (const entry of scored) {
      assert.ok(entry.score > 0 && entry.score <= 1);
    }
    assert.equal(scored[0]?.score, 1);
  });

  it("matches nothing when no token is usable", () => {
    assert.deepEqual(scoreFuzzy([row()], "a b"), []);
  });
});
