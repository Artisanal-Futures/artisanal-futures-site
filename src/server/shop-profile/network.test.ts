/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  NetworkEventInput,
  NetworkShopInput,
  NetworkSubjectInput,
} from "./network";

import { buildNetwork, rankCategories } from "./network";
import { MAX_NETWORK_ITEMS } from "./types";

const BASE = "https://af.example.org";
const NOW = new Date("2026-10-27T12:00:00.000Z");

// Detroit; ~0.0145° of latitude ≈ 1 mile.
const DETROIT = { lat: 42.3314, lng: -83.0458 };
const milesNorth = (miles: number) => ({
  lat: DETROIT.lat + miles / 69.05,
  lng: DETROIT.lng,
});

function subject(
  overrides: Partial<NetworkSubjectInput> = {},
): NetworkSubjectInput {
  return {
    id: "me",
    geo: DETROIT,
    state: "MI",
    attributeTags: ["Black Owned", "Worker Owned"],
    categories: ["Jewelry"],
    ...overrides,
  };
}

function shop(overrides: Partial<NetworkShopInput> = {}): NetworkShopInput {
  return {
    id: "other",
    slug: "other",
    name: "Other",
    city: "Detroit",
    state: "MI",
    geo: null,
    attributeTags: [],
    categories: [],
    ...overrides,
  };
}

function event(overrides: Partial<NetworkEventInput> = {}): NetworkEventInput {
  return {
    title: "Market",
    startDate: new Date("2026-11-05T15:00:00.000Z"),
    endDate: null,
    location: "Eastern Market",
    callToActionLink: null,
    shop: {
      id: "host",
      slug: "host",
      name: "Host",
      city: "Detroit",
      state: "MI",
      geo: null,
    },
    ...overrides,
  };
}

const run = (
  s: NetworkSubjectInput,
  shops: NetworkShopInput[],
  events: NetworkEventInput[] = [],
) => buildNetwork(s, shops, events, { baseUrl: BASE, now: NOW });

describe("rankCategories", () => {
  it("orders by frequency, then name", () => {
    assert.deepEqual(
      rankCategories(["Textiles", "Ceramics", "Textiles", "Art", " ", "Art"]),
      ["Art", "Textiles", "Ceramics"],
    );
  });
});

describe("buildNetwork", () => {
  it("never includes the subject shop", () => {
    const me = shop({
      id: "me",
      geo: DETROIT,
      attributeTags: ["Black Owned"],
      categories: ["Ceramics"],
    });
    const result = run(subject(), [me]);
    assert.equal(result.nearby.length, 0);
    assert.equal(result.sharedValues.length, 0);
    assert.equal(result.complementary.length, 0);
  });

  it("emits a rounded distance and an AF URL, never coordinates or ids", () => {
    const result = run(subject(), [
      shop({ id: "secret-id", slug: null, geo: milesNorth(4.23) }),
    ]);
    const [entry] = result.nearby;
    assert.ok(entry);
    assert.equal(entry.distanceMiles, 4.2);
    assert.equal(entry.reason, "4.2 mi away");
    // Shops without a slug fall back to the id path (the public URL).
    assert.equal(entry.url, `${BASE}/shops/secret-id`);
    assert.deepEqual(Object.keys(entry).sort(), [
      "attributeTags",
      "categories",
      "distanceMiles",
      "locality",
      "name",
      "reason",
      "url",
    ]);
    assert.equal(entry.locality, "Detroit, MI");
  });

  describe("nearby", () => {
    it("sorts by distance and drops shops past 50 mi or without geo", () => {
      const result = run(subject(), [
        shop({ id: "far", name: "Far", geo: milesNorth(51) }),
        shop({ id: "b", name: "Twenty", geo: milesNorth(20) }),
        shop({ id: "a", name: "Two", geo: milesNorth(2) }),
        shop({ id: "nogeo", name: "No geo", geo: null }),
      ]);
      assert.deepEqual(
        result.nearby.map((s) => s.name),
        ["Two", "Twenty"],
      );
    });

    it("caps the group", () => {
      const many = Array.from({ length: 15 }, (_, i) =>
        shop({ id: `s${i}`, name: `S${i}`, geo: milesNorth(i + 1) }),
      );
      assert.equal(run(subject(), many).nearby.length, MAX_NETWORK_ITEMS);
    });

    it("is empty when the subject has no coordinates", () => {
      const result = run(subject({ geo: null }), [
        shop({ geo: milesNorth(1) }),
      ]);
      assert.deepEqual(result.nearby, []);
      assert.equal(result.sharedValues.length, 0);
    });
  });

  describe("sharedValues", () => {
    it("ranks by overlap, then distance (nulls last), and lists the tags", () => {
      const result = run(subject(), [
        shop({
          id: "one-near",
          name: "One near",
          geo: milesNorth(1),
          attributeTags: ["black owned"],
        }),
        shop({
          id: "two-nogeo",
          name: "Two no geo",
          geo: null,
          attributeTags: ["Worker Owned", "Black Owned"],
        }),
        shop({
          id: "one-far",
          name: "One far",
          geo: milesNorth(300),
          attributeTags: ["Worker Owned"],
        }),
        shop({
          id: "one-nogeo",
          name: "One no geo",
          geo: null,
          attributeTags: ["Worker Owned"],
        }),
        shop({ id: "none", attributeTags: ["Woman Owned"] }),
      ]);
      assert.deepEqual(
        result.sharedValues.map((s) => s.name),
        ["Two no geo", "One near", "One far", "One no geo"],
      );
      assert.equal(
        result.sharedValues[0]?.reason,
        "Shares Black Owned and Worker Owned",
      );
      assert.equal(result.sharedValues[0]?.distanceMiles, null);
    });

    it("works without subject coordinates", () => {
      const result = run(subject({ geo: null }), [
        shop({ attributeTags: ["Black Owned"] }),
      ]);
      assert.equal(result.sharedValues.length, 1);
      assert.equal(result.sharedValues[0]?.distanceMiles, null);
    });
  });

  describe("complementary", () => {
    it("keeps only nearby shops whose categories don't overlap", () => {
      const result = run(subject({ categories: ["Jewelry", "Textiles"] }), [
        shop({
          id: "overlap",
          name: "Overlap",
          geo: milesNorth(1),
          categories: ["Ceramics", "textiles"],
        }),
        shop({
          id: "disjoint-far",
          name: "Disjoint far",
          geo: milesNorth(10),
          categories: ["Food"],
        }),
        shop({
          id: "disjoint-near",
          name: "Disjoint near",
          geo: milesNorth(3),
          categories: ["Ceramics", "Woodwork", "Art"],
        }),
        shop({
          id: "empty",
          name: "No categories",
          geo: milesNorth(1),
          categories: [],
        }),
        shop({
          id: "too-far",
          name: "Too far",
          geo: milesNorth(80),
          categories: ["Food"],
        }),
      ]);
      assert.deepEqual(
        result.complementary.map((s) => s.name),
        ["Disjoint near", "Disjoint far"],
      );
      assert.equal(
        result.complementary[0]?.reason,
        "Nearby ceramics and woodwork maker — no overlap with your categories",
      );
      for (const entry of result.complementary) {
        assert.ok(
          entry.categories.every(
            (c) => !["jewelry", "textiles"].includes(c.toLowerCase()),
          ),
        );
      }
    });

    it("falls back to the same state when the subject has no coordinates", () => {
      const result = run(subject({ geo: null, state: "MI" }), [
        shop({ id: "mi", name: "In MI", state: "mi", categories: ["Food"] }),
        shop({ id: "oh", name: "In OH", state: "OH", categories: ["Food"] }),
      ]);
      assert.deepEqual(
        result.complementary.map((s) => s.name),
        ["In MI"],
      );
      assert.equal(
        result.complementary[0]?.reason,
        "Food maker also in MI — no overlap with your categories",
      );
    });

    it("is empty with neither coordinates nor a state", () => {
      const result = run(subject({ geo: null, state: null }), [
        shop({ categories: ["Food"] }),
      ]);
      assert.deepEqual(result.complementary, []);
    });
  });

  describe("upcomingEvents", () => {
    it("drops past and own events, sorts by distance when the subject has geo", () => {
      const result = run(
        subject(),
        [],
        [
          event({
            title: "Past",
            startDate: new Date("2026-10-01T00:00:00.000Z"),
          }),
          event({
            title: "Mine",
            shop: { ...event().shop, id: "me" },
          }),
          event({
            title: "Far",
            shop: { ...event().shop, geo: milesNorth(30) },
          }),
          event({
            title: "Near",
            startDate: new Date("2027-03-01T00:00:00.000Z"),
            shop: { ...event().shop, geo: milesNorth(2) },
          }),
          event({ title: "Unknown distance" }),
        ],
      );
      assert.deepEqual(
        result.upcomingEvents.map((e) => e.title),
        ["Near", "Far", "Unknown distance"],
      );
      assert.equal(result.upcomingEvents[0]?.distanceMiles, 2);
      assert.equal(result.upcomingEvents[0]?.hostShop, "Host");
    });

    it("sorts by date without subject geo and links to the CTA or the host", () => {
      const result = run(
        subject({ geo: null }),
        [],
        [
          event({
            title: "Later",
            startDate: new Date("2026-12-01T00:00:00.000Z"),
            callToActionLink: "https://tickets.example.com/x",
          }),
          event({
            title: "Sooner",
            callToActionLink: "javascript:alert(1)",
          }),
        ],
      );
      assert.deepEqual(
        result.upcomingEvents.map((e) => [e.title, e.url]),
        [
          ["Sooner", `${BASE}/shops/host`],
          ["Later", "https://tickets.example.com/x"],
        ],
      );
    });
  });
});
