/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { MapShop } from "./types";
import {
  computeMapStats,
  countAttributes,
  distanceMiles,
  formatDistance,
} from "./map-stats";
import { STORE_ATTRIBUTES } from "~/lib/constants/store-attributes";

function shop(overrides: Partial<MapShop> = {}): MapShop {
  return {
    id: "shop",
    slug: null,
    name: "Shop",
    ownerName: "Owner",
    logoPhoto: null,
    ownerPhoto: null,
    website: null,
    email: null,
    phone: null,
    attributeTags: [],
    locality: null,
    location: null,
    precision: "approximate",
    streetAddress: null,
    productCount: 0,
    serviceCount: 0,
    isNew: false,
    ...overrides,
  };
}

describe("computeMapStats", () => {
  it("returns zeros for an empty list", () => {
    assert.deepEqual(computeMapStats([]), {
      artisans: 0,
      cities: 0,
      storefronts: 0,
      products: 0,
      services: 0,
    });
  });

  it("sums products, services, and storefronts", () => {
    const stats = computeMapStats([
      shop({ precision: "exact", productCount: 3, serviceCount: 1 }),
      shop({ precision: "approximate", productCount: 2, serviceCount: 0 }),
      shop({ precision: "exact", productCount: 0, serviceCount: 4 }),
    ]);
    assert.equal(stats.artisans, 3);
    assert.equal(stats.storefronts, 2);
    assert.equal(stats.products, 5);
    assert.equal(stats.services, 5);
  });

  it("skips null localities when counting cities", () => {
    const stats = computeMapStats([
      shop({ locality: null }),
      shop({ locality: "Detroit, MI" }),
      shop({ locality: null }),
    ]);
    assert.equal(stats.artisans, 3);
    assert.equal(stats.cities, 1);
  });

  it("counts cities that differ only by case once", () => {
    const stats = computeMapStats([
      shop({ locality: "Detroit, MI" }),
      shop({ locality: "DETROIT, mi" }),
      shop({ locality: "Chicago, IL" }),
    ]);
    assert.equal(stats.cities, 2);
  });
});

describe("countAttributes", () => {
  it("has every attribute, in order, with zeros for an empty list", () => {
    const counts = countAttributes([]);
    assert.deepEqual([...counts.keys()], [...STORE_ATTRIBUTES]);
    assert.ok([...counts.values()].every((n) => n === 0));
  });

  it("counts shops per attribute and ignores unknown tags", () => {
    const counts = countAttributes([
      { attributeTags: ["Black Owned", "Woman Owned"] },
      { attributeTags: ["Black Owned", "Not A Real Tag"] },
      { attributeTags: [] },
    ]);
    assert.equal(counts.get("Black Owned"), 2);
    assert.equal(counts.get("Woman Owned"), 1);
    assert.equal(counts.get("Food Sovereignty"), 0);
    assert.equal(counts.has("Not A Real Tag"), false);
    assert.equal(counts.size, STORE_ATTRIBUTES.length);
  });

  it("counts a duplicated tag on one shop once", () => {
    const counts = countAttributes([
      { attributeTags: ["Worker Owned", "Worker Owned"] },
    ]);
    assert.equal(counts.get("Worker Owned"), 1);
  });
});

describe("distanceMiles", () => {
  const nyc = { lat: 40.7128, lng: -74.006 };
  const la = { lat: 34.0522, lng: -118.2437 };

  it("is about 2445 miles from New York to Los Angeles", () => {
    const miles = distanceMiles(nyc, la);
    assert.ok(Math.abs(miles - 2445) < 15, `got ${miles}`);
  });

  it("is zero for the same point and symmetric", () => {
    assert.equal(distanceMiles(nyc, nyc), 0);
    assert.ok(Math.abs(distanceMiles(nyc, la) - distanceMiles(la, nyc)) < 1e-9);
  });

  it("is about 69 miles per degree of latitude", () => {
    const miles = distanceMiles({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    assert.ok(Math.abs(miles - 69.09) < 0.1, `got ${miles}`);
  });
});

describe("formatDistance", () => {
  it("shows <1 mi under a mile", () => {
    assert.equal(formatDistance(0, false), "<1 mi");
    assert.equal(formatDistance(0.99, false), "<1 mi");
  });

  it("keeps <1 mi unprefixed when approximate", () => {
    assert.equal(formatDistance(0.5, true), "<1 mi");
  });

  it("uses one decimal from 1 to under 10", () => {
    assert.equal(formatDistance(1, false), "1.0 mi");
    assert.equal(formatDistance(8.24, false), "8.2 mi");
    assert.equal(formatDistance(9.94, false), "9.9 mi");
  });

  it("never renders 10.0 mi", () => {
    assert.equal(formatDistance(9.95, false), "10 mi");
    assert.equal(formatDistance(9.99, false), "10 mi");
  });

  it("uses whole numbers from 10 up", () => {
    assert.equal(formatDistance(10, false), "10 mi");
    assert.equal(formatDistance(22.6, false), "23 mi");
    assert.equal(formatDistance(1234.4, false), "1234 mi");
  });

  it("prefixes ~ when approximate", () => {
    assert.equal(formatDistance(8.2, true), "~8.2 mi");
    assert.equal(formatDistance(23, true), "~23 mi");
  });
});
