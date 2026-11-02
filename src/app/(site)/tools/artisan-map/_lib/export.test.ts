/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Papa from "papaparse";

import {
  buildCitation,
  EXPORT_FIELDS,
  exportFileName,
  MAP_DATA_LICENSE,
  toCsv,
  toExportRow,
  toGeoJson,
} from "./export";
import { mapShop, TEST_SECTORS } from "./test-shop";

const ORIGIN = "https://example.org";

/** A shop with every private field filled, to prove none of them leak. */
const privateShop = mapShop({
  id: "s1",
  slug: "kente-collective",
  name: "Kente Collective",
  ownerName: "Ama Secret-Owner",
  logoPhoto: "https://cdn.example/logo-secret.png",
  ownerPhoto: "https://cdn.example/owner-secret.png",
  email: "secret@example.com",
  phone: "+1 313 555 0199",
  website: "https://kente.example",
  attributeTags: ["Black Owned", "Woman Owned"],
  sector: "clothing-adornment",
  locality: "Detroit, MI",
  location: { lat: 42.3314, lng: -83.0458 },
  precision: "approximate",
  streetAddress: "123 Hidden St",
  productCount: 4,
  serviceCount: 1,
  isNew: true,
  collab: {
    offerTags: ["Storage space"],
    needTags: ["Referrals", "Local delivery"],
    offers: "free-text offer",
    needs: "free-text need",
  },
});

const PRIVATE_VALUES = [
  "Ama Secret-Owner",
  "secret@example.com",
  "+1 313 555 0199",
  "logo-secret",
  "owner-secret",
  "123 Hidden St",
];

describe("toExportRow", () => {
  it("keeps exactly the allow-listed fields, in order", () => {
    assert.deepEqual(
      Object.keys(toExportRow(privateShop, ORIGIN, TEST_SECTORS)),
      [...EXPORT_FIELDS],
    );
  });

  it("never includes email, phone, owner or photos", () => {
    const row = toExportRow(privateShop, ORIGIN, TEST_SECTORS) as Record<
      string,
      unknown
    >;
    for (const key of [
      "email",
      "phone",
      "ownerName",
      "logoPhoto",
      "ownerPhoto",
      "isNew",
      "slug",
    ]) {
      assert.equal(key in row, false, key);
    }
  });

  it("maps the public fields", () => {
    assert.deepEqual(toExportRow(privateShop, ORIGIN, TEST_SECTORS), {
      id: "s1",
      name: "Kente Collective",
      sector: "clothing-adornment",
      sectorLabel: "Clothing & Adornment",
      locality: "Detroit, MI",
      lat: 42.3314,
      lng: -83.0458,
      precision: "approximate",
      streetAddress: null,
      website: "https://kente.example",
      profileUrl: "https://example.org/shops/kente-collective",
      attributeTags: ["Black Owned", "Woman Owned"],
      openToCollaborate: true,
      collabOfferTags: ["Storage space"],
      collabNeedTags: ["Referrals", "Local delivery"],
      productCount: 4,
      serviceCount: 1,
    });
  });

  it("labels a shop without a known sector as Other", () => {
    const row = toExportRow(mapShop({ sector: "other" }), ORIGIN, TEST_SECTORS);
    assert.equal(row.sector, "other");
    assert.equal(row.sectorLabel, "Other");
  });

  it("only exports a street address for an exact storefront pin", () => {
    const storefront = mapShop({
      precision: "exact",
      streetAddress: "1 Main St",
    });
    assert.equal(
      toExportRow(storefront, ORIGIN, TEST_SECTORS).streetAddress,
      "1 Main St",
    );
    assert.equal(
      toExportRow(
        { ...storefront, precision: "approximate" },
        ORIGIN,
        TEST_SECTORS,
      ).streetAddress,
      null,
    );
  });

  it("falls back to the id for the profile URL and blanks a missing location", () => {
    const row = toExportRow(mapShop({ id: "abc" }), ORIGIN, TEST_SECTORS);
    assert.equal(row.profileUrl, "https://example.org/shops/abc");
    assert.equal(row.lat, null);
    assert.equal(row.lng, null);
    assert.equal(row.openToCollaborate, false);
    assert.deepEqual(row.collabOfferTags, []);
  });
});

describe("toCsv", () => {
  it("writes the allow-listed header and one row per shop", () => {
    const parsed = Papa.parse<string[]>(
      toCsv([privateShop], ORIGIN, TEST_SECTORS),
      {
        skipEmptyLines: true,
      },
    );
    assert.deepEqual(parsed.data[0], [...EXPORT_FIELDS]);
    assert.equal(parsed.data.length, 2);
    const row = Object.fromEntries(
      EXPORT_FIELDS.map((field, i) => [field, parsed.data[1]![i]]),
    );
    assert.equal(row.attributeTags, "Black Owned; Woman Owned");
    assert.equal(row.lng, "-83.0458");
    assert.equal(row.openToCollaborate, "true");
  });

  it("contains none of the private values anywhere", () => {
    const csv = toCsv([privateShop], ORIGIN, TEST_SECTORS);
    for (const value of PRIVATE_VALUES) {
      assert.equal(csv.includes(value), false, value);
    }
  });

  it("neutralises formula injection in text cells", () => {
    const csv = toCsv(
      [
        mapShop({ id: "a", name: '=HYPERLINK("http://evil")' }),
        mapShop({ id: "b", name: "+1+1" }),
        mapShop({ id: "c", name: "-2+3" }),
        mapShop({ id: "d", name: "@SUM(A1)" }),
        mapShop({ id: "e", name: "\tTabbed" }),
        mapShop({ id: "f", name: "=1\nsecond line" }),
        mapShop({ id: "g", locality: "=cmd|' /C calc'!A0" }),
        mapShop({ id: "h", attributeTags: ["=evil", "fine"] }),
      ],
      ORIGIN,
      TEST_SECTORS,
    );
    const rows = Papa.parse<string[]>(csv, { skipEmptyLines: true }).data;
    const nameAt = EXPORT_FIELDS.indexOf("name");
    const localityAt = EXPORT_FIELDS.indexOf("locality");
    const tagsAt = EXPORT_FIELDS.indexOf("attributeTags");
    const names = rows.slice(1, 7).map((row) => row[nameAt]);
    for (const name of names) assert.equal(name?.startsWith("'"), true, name);
    assert.equal(rows[7]![localityAt], "'=cmd|' /C calc'!A0");
    assert.equal(rows[8]![tagsAt], "'=evil; fine");
  });

  it("leaves negative coordinates as numbers", () => {
    const csv = toCsv(
      [mapShop({ location: { lat: -33.9, lng: -83.05 } })],
      ORIGIN,
      TEST_SECTORS,
    );
    const rows = Papa.parse<string[]>(csv, { skipEmptyLines: true }).data;
    assert.equal(rows[1]![EXPORT_FIELDS.indexOf("lat")], "-33.9");
    assert.equal(rows[1]![EXPORT_FIELDS.indexOf("lng")], "-83.05");
  });
});

describe("toGeoJson", () => {
  it("puts the pin position in the geometry, [lng, lat]", () => {
    const fc = toGeoJson([privateShop], ORIGIN, TEST_SECTORS);
    assert.equal(fc.type, "FeatureCollection");
    const feature = fc.features[0]!;
    assert.deepEqual(feature.geometry, {
      type: "Point",
      coordinates: [-83.0458, 42.3314],
    });
    assert.equal(feature.id, "s1");
    assert.equal("lat" in feature.properties, false);
    assert.deepEqual(Object.keys(feature.properties), [
      ...EXPORT_FIELDS.filter((f) => f !== "lat" && f !== "lng"),
    ]);
  });

  it("keeps unlocated shops with a null geometry", () => {
    const fc = toGeoJson([mapShop({ id: "x" })], ORIGIN, TEST_SECTORS);
    assert.equal(fc.features[0]!.geometry, null);
  });

  it("contains none of the private values anywhere", () => {
    const json = JSON.stringify(toGeoJson([privateShop], ORIGIN, TEST_SECTORS));
    for (const value of PRIVATE_VALUES) {
      assert.equal(json.includes(value), false, value);
    }
  });
});

describe("buildCitation", () => {
  it("names the publisher, year, URL, access date and licence", () => {
    const citation = buildCitation({
      url: "https://example.org/tools/artisan-map",
      date: new Date("2026-10-30T12:00:00Z"),
    });
    assert.equal(
      citation,
      "Artisanal Futures (2026). Artisan Map [Data set]. " +
        "https://example.org/tools/artisan-map. Accessed October 30, 2026. " +
        `Licensed under ${MAP_DATA_LICENSE.name} (${MAP_DATA_LICENSE.url}).`,
    );
  });
});

describe("exportFileName", () => {
  it("includes the scope, date and extension", () => {
    const date = new Date("2026-10-30T12:00:00Z");
    assert.equal(
      exportFileName("filtered", "geojson", date),
      "artisan-map-filtered-2026-10-30.geojson",
    );
    assert.equal(
      exportFileName("all", "csv", date),
      "artisan-map-all-2026-10-30.csv",
    );
  });
});
