/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  NetworkEventInput,
  NetworkShopInput,
  NetworkSubjectInput,
} from "./network";

import { buildNetwork, rankCategories } from "./network";
import {
  DIRECTORY_COLLAB_TEXT_MAX_CHARS,
  DIRECTORY_MAX,
  DIRECTORY_MAX_SERVICES,
} from "./types";

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
  return { id: "me", geo: DETROIT, ...overrides };
}

function shop(overrides: Partial<NetworkShopInput> = {}): NetworkShopInput {
  return {
    id: "other",
    slug: "other",
    name: "Other",
    city: "Detroit",
    state: "MI",
    geo: null,
    locationType: "HOME_BASED",
    bio: null,
    description: null,
    attributeTags: [],
    categories: [],
    services: [],
    productCount: 0,
    collabOffers: null,
    collabOfferTags: [],
    collabNeeds: null,
    collabNeedTags: [],
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
  describe("directory", () => {
    it("never includes the subject shop", () => {
      const { network, directoryTotal } = run(subject(), [
        shop({ id: "me", name: "Me", geo: DETROIT }),
        shop({ id: "a", name: "A" }),
      ]);
      assert.deepEqual(
        network.directory.map((s) => s.name),
        ["A"],
      );
      assert.equal(directoryTotal, 1);
    });

    it("emits a rounded distance and an AF URL, never coordinates or ids", () => {
      const geo = milesNorth(4.23);
      const { network } = run(subject(), [
        shop({ id: "secret-id", slug: null, geo, locationType: "STOREFRONT" }),
      ]);
      const [entry] = network.directory;
      assert.ok(entry);
      assert.equal(entry.distanceMiles, 4.2);
      // Shops without a slug fall back to the id path (the public URL).
      assert.equal(entry.url, `${BASE}/shops/secret-id`);
      assert.equal(entry.locality, "Detroit, MI");
      assert.equal(entry.locationType, "STOREFRONT");
      assert.deepEqual(Object.keys(entry).sort(), [
        "about",
        "attributeTags",
        "categories",
        "collaboration",
        "distanceMiles",
        "locality",
        "locationType",
        "name",
        "productCount",
        "services",
        "url",
      ]);
      const json = JSON.stringify(network.directory);
      assert.ok(!json.includes(String(geo.lat).slice(0, 7)));
      assert.ok(!json.includes(String(geo.lng)));
      assert.ok(!json.includes('"secret-id"'));
      assert.ok(!json.includes('"id"'));
    });

    it("lists shops with a collaboration listing first, then by distance (nulls last), then name", () => {
      const { network } = run(subject(), [
        shop({ id: "b-nogeo", name: "Bravo", geo: null }),
        shop({ id: "a-nogeo", name: "alpha", geo: null }),
        shop({ id: "far", name: "Far", geo: milesNorth(20) }),
        shop({ id: "near", name: "Near", geo: milesNorth(2) }),
        shop({
          id: "open-far",
          name: "Open far",
          geo: milesNorth(30),
          collabNeedTags: ["Local delivery"],
        }),
        shop({
          id: "open-nogeo",
          name: "Open no geo",
          geo: null,
          collabOffers: "Room in the van on Tuesdays",
        }),
        shop({
          id: "open-near",
          name: "Open near",
          geo: milesNorth(5),
          collabOfferTags: ["Storage space"],
        }),
        // Blank text and blank tags don't count as a listing.
        shop({
          id: "blank",
          name: "Blank listing",
          geo: milesNorth(1),
          collabOffers: "   ",
          collabNeedTags: [" "],
        }),
      ]);
      assert.deepEqual(
        network.directory.map((s) => s.name),
        [
          "Open near",
          "Open far",
          "Open no geo",
          "Blank listing",
          "Near",
          "Far",
          "alpha",
          "Bravo",
        ],
      );
    });

    it("has null distances without subject coordinates and sorts by name", () => {
      const { network } = run(subject({ geo: null }), [
        shop({ id: "z", name: "Zed", geo: milesNorth(1) }),
        shop({ id: "a", name: "Ada", geo: milesNorth(9) }),
      ]);
      assert.deepEqual(
        network.directory.map((s) => [s.name, s.distanceMiles]),
        [
          ["Ada", null],
          ["Zed", null],
        ],
      );
    });

    it("caps at DIRECTORY_MAX and flags the truncation", () => {
      const many = Array.from({ length: DIRECTORY_MAX + 5 }, (_, i) =>
        shop({ id: `s${i}`, name: `S${String(i).padStart(3, "0")}` }),
      );
      const { network, directoryTotal } = run(subject(), [
        shop({ id: "me" }),
        ...many,
      ]);
      assert.equal(network.directory.length, DIRECTORY_MAX);
      assert.equal(network.directoryTruncated, true);
      assert.equal(directoryTotal, DIRECTORY_MAX + 5);

      const small = run(subject(), many.slice(0, 3));
      assert.equal(small.network.directoryTruncated, false);
      assert.equal(small.directoryTotal, 3);
    });

    it("builds a plain-text about from the bio, else the description", () => {
      const long = `${"word ".repeat(100)}end`;
      const { network } = run(subject({ geo: null }), [
        shop({
          id: "a",
          name: "A",
          bio: "<p>Potter &amp; <strong>teacher</strong></p>",
          description: "Ignored",
        }),
        shop({ id: "b", name: "B", bio: "  ", description: "**Bold** shop" }),
        shop({
          id: "c",
          name: "C",
          bio: "No description available",
          description: "No description available",
        }),
        shop({ id: "d", name: "D", description: long }),
      ]);
      const about = network.directory.map((s) => s.about);
      assert.equal(about[0], "Potter & teacher");
      assert.equal(about[1], "Bold shop");
      assert.equal(about[2], null);
      assert.ok(about[3]);
      assert.ok(about[3].length <= 300);
      assert.ok(about[3].endsWith("…"));
    });

    it("caps categories and services, and passes counts and tags through", () => {
      const { network } = run(subject(), [
        shop({
          categories: ["A", "B", "C", "D", "E", "F"],
          services: [
            "Class",
            " class ",
            ...Array.from({ length: 10 }, (_, i) => `Service ${i}`),
          ],
          attributeTags: ["Black Owned", "black owned", " "],
          productCount: 12,
        }),
      ]);
      const [entry] = network.directory;
      assert.ok(entry);
      assert.deepEqual(entry.categories, ["A", "B", "C", "D", "E"]);
      assert.equal(entry.services.length, DIRECTORY_MAX_SERVICES);
      assert.deepEqual(entry.services.slice(0, 2), ["Class", "Service 0"]);
      assert.deepEqual(entry.attributeTags, ["Black Owned"]);
      assert.equal(entry.productCount, 12);
    });

    it("passes the collaboration listing through, capping its text", () => {
      const long = `${"van ".repeat(120)}end`;
      const { network } = run(subject(), [
        shop({
          collabOffers: long,
          collabOfferTags: ["Local delivery", "Local delivery", "Referrals"],
          collabNeeds: "  A <em>shared</em> kitchen  ",
          collabNeedTags: ["Kitchen or production space"],
        }),
        shop({ id: "none", name: "None" }),
      ]);
      const [open, none] = network.directory;
      assert.ok(open && none);
      assert.ok(open.collaboration.offers);
      assert.ok(
        open.collaboration.offers.length <= DIRECTORY_COLLAB_TEXT_MAX_CHARS,
      );
      assert.ok(open.collaboration.offers.endsWith("…"));
      assert.deepEqual(open.collaboration.offerTags, [
        "Local delivery",
        "Referrals",
      ]);
      assert.equal(open.collaboration.needs, "A shared kitchen");
      assert.deepEqual(open.collaboration.needTags, [
        "Kitchen or production space",
      ]);
      assert.deepEqual(none.collaboration, {
        offers: null,
        offerTags: [],
        needs: null,
        needTags: [],
      });
    });
  });

  describe("upcomingEvents", () => {
    it("drops past and own events, sorts by distance when the subject has geo", () => {
      const { network: result } = run(
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
      const { network: result } = run(
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
