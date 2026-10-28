/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  ShopProfileSource,
  ShopProfileSourceProduct,
  ShopProfileSourceService,
} from "./build";
import type { NetworkShopInput } from "./network";

import { buildShopProfile } from "./build";
import { COLLAB_TEXT_MAX_CHARS, MAX_ITEMS, SHOP_PROFILE_SCHEMA } from "./types";

const BASE = "https://af.example.org";
const NOW = new Date("2026-10-27T12:00:00.000Z");

function product(
  overrides: Partial<ShopProfileSourceProduct> = {},
): ShopProfileSourceProduct {
  return {
    name: "Mug",
    description: "<p>Wheel-thrown <strong>stoneware</strong> &amp; glaze.</p>",
    priceInCents: 3200,
    currency: "usd",
    imageUrl: "mug.jpg",
    productUrl: "https://shop.example.com/mug",
    tags: ["mug", "Kitchen"],
    attributeTags: ["kitchen"],
    materialTags: ["Clay"],
    environmentalTags: ["Local"],
    isPublic: true,
    isFeatured: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    categories: ["Ceramics"],
    ...overrides,
  };
}

function service(
  overrides: Partial<ShopProfileSourceService> = {},
): ShopProfileSourceService {
  return {
    name: "Pottery class",
    description: "Two hours at the wheel.",
    priceInCents: 6000,
    currency: null,
    imageUrl: null,
    serviceUrl: "https://shop.example.com/class",
    durationInMinutes: 120,
    tags: ["class"],
    attributeTags: ["Community Education"],
    isPublic: true,
    isFeatured: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    categories: ["Workshops"],
    ...overrides,
  };
}

function networkShop(
  overrides: Partial<NetworkShopInput> = {},
): NetworkShopInput {
  return {
    id: "other-db-id",
    slug: "other",
    name: "Other",
    city: "Detroit",
    state: "MI",
    geo: { lat: 42.4, lng: -83.1 },
    locationType: "HOME_BASED",
    bio: null,
    description: null,
    attributeTags: ["Black Owned"],
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

function source(overrides: Partial<ShopProfileSource> = {}): ShopProfileSource {
  return {
    shop: {
      id: "shop-1",
      slug: "clay-co",
      name: " Clay Co ",
      ownerName: "Ada",
      bio: "Potter.",
      description: "<p>We make <em>pots</em></p>",
      website: "clay.example.com",
      socialLinks: ["instagram.com/clayco", "not a link"],
      logoPhoto: "logo.png",
      attributeTags: ["Black Owned", "black owned", " "],
      collabOffers: null,
      collabOfferTags: [],
      collabNeeds: null,
      collabNeedTags: [],
      locationType: "HOME_BASED",
      syncPlatform: null,
      syncEnabled: false,
      syncUrl: null,
      lastSyncedAt: null,
      address: {
        address: "12 Secret Ln",
        additional: "Apt 4",
        street: null,
        zip: "48201-1234",
        city: "Detroit",
        state: "MI",
        country: "US",
        latitude: 42.3314,
        longitude: -83.0458,
        geocodePrecision: "locality",
      },
    },
    products: [product()],
    productTotal: 1,
    services: [service()],
    serviceTotal: 1,
    networkShops: [],
    events: [],
    ...overrides,
  };
}

const build = (s: ShopProfileSource) =>
  buildShopProfile(s, { baseUrl: `${BASE}/`, now: NOW });

describe("buildShopProfile", () => {
  it("builds the shop block", () => {
    const profile = build(source());
    assert.equal(profile.schema, SHOP_PROFILE_SCHEMA);
    assert.equal(profile.generatedAt, NOW.toISOString());
    assert.equal(profile.shop.name, "Clay Co");
    assert.equal(profile.shop.url, `${BASE}/shops/clay-co`);
    assert.equal(profile.shop.description, "We make pots");
    assert.equal(profile.shop.website, "https://clay.example.com");
    assert.deepEqual(profile.shop.socialLinks, [
      "https://instagram.com/clayco",
    ]);
    assert.equal(
      profile.shop.logoUrl,
      "https://storage.artisanalfutures.org/shops/logo.png",
    );
    assert.deepEqual(profile.shop.attributeTags, ["Black Owned"]);
    assert.deepEqual(profile.shop.locality, {
      city: "Detroit",
      state: "MI",
      country: "US",
    });
  });

  it("omits locality when only a country is set", () => {
    const base = source();
    const profile = build({
      ...base,
      shop: {
        ...base.shop,
        address: { ...base.shop.address!, city: "", state: "  " },
      },
    });
    assert.equal(profile.shop.locality, null);
  });

  it("omits locality when there is no address", () => {
    const base = source();
    const profile = build({ ...base, shop: { ...base.shop, address: null } });
    assert.equal(profile.shop.locality, null);
  });

  it("keeps a state-only locality with a null city", () => {
    const base = source();
    const profile = build({
      ...base,
      shop: {
        ...base.shop,
        address: { ...base.shop.address!, city: "" },
      },
    });
    assert.deepEqual(profile.shop.locality, {
      city: null,
      state: "MI",
      country: "US",
    });
  });

  it("hides the street and offsets the pin for a non-storefront shop", () => {
    const profile = build(source());
    const json = JSON.stringify(profile);
    assert.equal(profile.shop.streetAddress, null);
    assert.ok(!json.includes("Secret Ln"));
    assert.ok(!json.includes("Apt 4"));
    assert.ok(!json.includes("1234"));
    assert.equal(profile.shop.geo?.precision, "approximate");
    assert.notDeepEqual(
      { lat: profile.shop.geo?.lat, lng: profile.shop.geo?.lng },
      { lat: 42.3314, lng: -83.0458 },
    );
  });

  it("shows the street and exact pin for a street-geocoded storefront", () => {
    const base = source();
    const profile = build({
      ...base,
      shop: {
        ...base.shop,
        locationType: "STOREFRONT",
        address: { ...base.shop.address!, geocodePrecision: "street" },
      },
    });
    assert.equal(profile.shop.streetAddress, "12 Secret Ln, Apt 4");
    assert.deepEqual(profile.shop.geo, {
      lat: 42.3314,
      lng: -83.0458,
      precision: "exact",
    });
  });

  it("never emits private or internal fields", () => {
    const base = source();
    const json = JSON.stringify(
      build({
        ...base,
        shop: {
          ...base.shop,
          syncPlatform: "SHOPIFY",
          syncEnabled: true,
          syncUrl: "https://feed.example.com/secret/products.json?key=abc",
        },
        networkShops: [networkShop()],
      }),
    );
    for (const secret of [
      "shop-1",
      "other-db-id",
      "secret/products",
      "key=abc",
      "42.4",
      "-83.1,",
    ]) {
      assert.ok(!json.includes(secret), `leaked ${secret}`);
    }
    assert.ok(json.includes('"syncedFrom":"https://feed.example.com"'));
  });

  describe("catalog mode", () => {
    it("is full for a manual catalog", () => {
      const profile = build(source());
      assert.equal(profile.catalog.mode, "full");
      assert.equal(profile.catalog.source, "MANUAL");
      assert.equal(profile.catalog.syncedFrom, null);
      assert.deepEqual(profile.products[0], {
        name: "Mug",
        productUrl: "https://shop.example.com/mug",
        afCategories: ["Ceramics"],
        tags: ["mug", "Kitchen", "Clay", "Local"],
        priceInCents: 3200,
        currency: "USD",
        description: "Wheel-thrown stoneware & glaze.",
        imageUrl: "https://storage.artisanalfutures.org/products/mug.jpg",
        isFeatured: false,
      });
    });

    it("is full (MANUAL) when a platform is set but sync is off", () => {
      const base = source();
      const profile = build({
        ...base,
        shop: {
          ...base.shop,
          syncPlatform: "SIMPLEPRESS",
          syncEnabled: false,
        },
      });
      assert.equal(profile.catalog.mode, "full");
      assert.equal(profile.catalog.source, "MANUAL");
      // The platform is still known, so its origin is reported.
      assert.equal(profile.catalog.syncedFrom, "https://clay.example.com");
    });

    it("is a lean overlay for a SimplePress-synced catalog", () => {
      const base = source();
      const profile = build({
        ...base,
        shop: {
          ...base.shop,
          syncPlatform: "SIMPLEPRESS",
          syncEnabled: true,
          lastSyncedAt: new Date("2026-10-26T00:00:00.000Z"),
        },
      });
      assert.equal(profile.catalog.mode, "overlay");
      assert.equal(profile.catalog.source, "SIMPLEPRESS");
      assert.equal(profile.catalog.lastSyncedAt, "2026-10-26T00:00:00.000Z");
      assert.deepEqual(profile.products, [
        {
          name: "Mug",
          productUrl: "https://shop.example.com/mug",
          afCategories: ["Ceramics"],
          tags: ["mug", "Kitchen", "Clay", "Local"],
        },
      ]);
    });
  });

  it("lists public items, featured first then newest, capped with truncated", () => {
    const profile = build(
      source({
        products: [
          product({ name: "Old", createdAt: new Date("2025-01-01") }),
          product({ name: "Hidden", isPublic: false }),
          product({ name: "New", createdAt: new Date("2026-06-01") }),
          product({
            name: "Featured",
            isFeatured: true,
            createdAt: new Date("2024-01-01"),
          }),
        ],
        productTotal: MAX_ITEMS + 3,
        services: [service(), service({ name: "Hidden", isPublic: false })],
      }),
    );
    assert.deepEqual(
      profile.products.map((p) => p.name),
      ["Featured", "New", "Old"],
    );
    assert.equal(profile.truncated, true);
    assert.equal(profile.counts.products, MAX_ITEMS + 3);
    assert.equal(profile.catalog.productCount, MAX_ITEMS + 3);
    assert.deepEqual(
      profile.services.map((s) => s.name),
      ["Pottery class"],
    );
    assert.equal(profile.services[0]?.currency, "USD");
    assert.deepEqual(profile.services[0]?.tags, [
      "class",
      "Community Education",
    ]);
  });

  it("is not truncated when everything fits", () => {
    assert.equal(build(source()).truncated, false);
  });

  it("emits the subject's collaboration listing, capped and de-duplicated", () => {
    const base = source();
    const long = `${"van ".repeat(200)}end`;
    const profile = build({
      ...base,
      shop: {
        ...base.shop,
        collabOffers: long,
        collabOfferTags: ["Local delivery", "local delivery", " "],
        collabNeeds: "  ",
        collabNeedTags: ["Storage space"],
      },
    });
    const { collaboration } = profile.shop;
    assert.ok(collaboration.offers);
    assert.ok(collaboration.offers.length <= COLLAB_TEXT_MAX_CHARS);
    assert.ok(collaboration.offers.length > 300);
    assert.deepEqual(collaboration.offerTags, ["Local delivery"]);
    assert.equal(collaboration.needs, null);
    assert.deepEqual(collaboration.needTags, ["Storage space"]);

    assert.deepEqual(build(source()).shop.collaboration, {
      offers: null,
      offerTags: [],
      needs: null,
      needTags: [],
    });
  });

  it("wires the directory from the real coordinates", () => {
    const profile = build(
      source({
        networkShops: [
          networkShop({
            id: "n1",
            slug: "near",
            name: "Near",
            geo: { lat: 42.3314 + 2 / 69.05, lng: -83.0458 },
          }),
          // The subject itself is never listed.
          networkShop({ id: "shop-1", slug: "clay-co", name: "Clay Co" }),
        ],
      }),
    );
    assert.deepEqual(
      profile.network.directory.map((s) => [s.name, s.distanceMiles]),
      [["Near", 2]],
    );
    assert.equal(profile.network.directoryTruncated, false);
    assert.equal(profile.counts.directory, 1);
    assert.equal(profile.counts.upcomingEvents, 0);
    assert.deepEqual(Object.keys(profile.network).sort(), [
      "directory",
      "directoryTruncated",
      "upcomingEvents",
    ]);
  });
});
