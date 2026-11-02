/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TEST_SLUGS } from "./test-shop";
import {
  applyUrlUpdates,
  clearFilterUpdates,
  parseList,
  parseMapUrlState,
  parseViewport,
  viewportUpdates,
} from "./url-state";

describe("parseMapUrlState", () => {
  it("defaults everything when the query string is empty", () => {
    assert.deepEqual(parseMapUrlState(new URLSearchParams(), TEST_SLUGS), {
      query: "",
      attributes: [],
      inPerson: false,
      sectors: [],
      collab: false,
      offers: [],
      needs: [],
      shop: null,
      viewport: null,
      layer: null,
    });
  });

  it("reads every param", () => {
    const state = parseMapUrlState(
      new URLSearchParams(
        "q=pottery&attributes=Black+Owned,Woman+Owned&visit=1&sectors=food-land,bogus" +
          "&collab=1&offers=storage-space,local-delivery,nope&needs=referrals" +
          "&shop=abc&lng=-83.05&lat=42.35&zoom=12&layer=neighborhoods",
      ),
      TEST_SLUGS,
    );
    assert.deepEqual(state, {
      query: "pottery",
      attributes: ["Black Owned", "Woman Owned"],
      inPerson: true,
      sectors: ["food-land"],
      collab: true,
      offers: ["Local delivery", "Storage space"],
      needs: ["Referrals"],
      shop: "abc",
      viewport: { longitude: -83.05, latitude: 42.35, zoom: 12 },
      layer: "neighborhoods",
    });
  });

  it("only treats visit=1 as on", () => {
    assert.equal(
      parseMapUrlState(new URLSearchParams("visit=true"), TEST_SLUGS).inPerson,
      false,
    );
  });
});

describe("layer", () => {
  const layer = (qs: string) =>
    parseMapUrlState(new URLSearchParams(qs), TEST_SLUGS).layer;

  it("reads each known overlay", () => {
    assert.equal(layer("layer=council"), "council");
    assert.equal(layer("layer=neighborhoods"), "neighborhoods");
    assert.equal(layer("layer=zip"), "zip");
  });

  it("ignores unknown, blank and differently-cased values", () => {
    assert.equal(layer("layer=wards"), null);
    assert.equal(layer("layer="), null);
    assert.equal(layer("layer=ZIP"), null);
    assert.equal(layer(""), null);
  });
});

describe("parseViewport", () => {
  const vp = (qs: string) => parseViewport(new URLSearchParams(qs));

  it("reads a complete camera", () => {
    assert.deepEqual(vp("lng=-83.0458&lat=42.3314&zoom=11.5"), {
      longitude: -83.0458,
      latitude: 42.3314,
      zoom: 11.5,
    });
  });

  it("needs all three params", () => {
    assert.equal(vp("lng=-83&lat=42"), null);
    assert.equal(vp("lat=42&zoom=10"), null);
    assert.equal(vp("lng=-83&zoom=10"), null);
    assert.equal(vp(""), null);
  });

  it("rejects blanks and non-decimal numbers", () => {
    assert.equal(vp("lng=&lat=42&zoom=10"), null);
    assert.equal(vp("lng=abc&lat=42&zoom=10"), null);
    assert.equal(vp("lng=0x10&lat=42&zoom=10"), null);
    assert.equal(vp("lng=1e2&lat=42&zoom=10"), null);
    assert.equal(vp("lng=Infinity&lat=42&zoom=10"), null);
  });

  it("range-checks each value", () => {
    assert.equal(vp("lng=181&lat=42&zoom=10"), null);
    assert.equal(vp("lng=-83&lat=86&zoom=10"), null);
    assert.equal(vp("lng=-83&lat=42&zoom=23"), null);
    assert.equal(vp("lng=-83&lat=42&zoom=-1"), null);
    assert.deepEqual(vp("lng=-180&lat=-85&zoom=0"), {
      longitude: -180,
      latitude: -85,
      zoom: 0,
    });
  });
});

describe("viewportUpdates", () => {
  it("rounds to 4 dp for position and 2 dp for zoom, without trailing zeros", () => {
    assert.deepEqual(
      viewportUpdates({
        longitude: -83.045833,
        latitude: 42.331427,
        zoom: 12.0049,
      }),
      { lng: "-83.0458", lat: "42.3314", zoom: "12" },
    );
  });

  it("wraps longitudes past the antimeridian", () => {
    assert.equal(
      viewportUpdates({ longitude: 190, latitude: 0, zoom: 2 }).lng,
      "-170",
    );
  });

  it("round-trips through parseViewport", () => {
    const qs = applyUrlUpdates(
      "",
      viewportUpdates({ longitude: -83.05, latitude: 42.35, zoom: 12.25 }),
    );
    assert.deepEqual(parseViewport(new URLSearchParams(qs)), {
      longitude: -83.05,
      latitude: 42.35,
      zoom: 12.25,
    });
  });
});

describe("parseList", () => {
  it("drops blanks and duplicates", () => {
    assert.deepEqual(parseList("a,,b, a ,"), ["a", "b"]);
    assert.deepEqual(parseList(null), []);
  });
});

describe("applyUrlUpdates", () => {
  it("sets, replaces and removes params, keeping the rest", () => {
    assert.equal(
      applyUrlUpdates("q=old&shop=abc&visit=1", {
        q: "new",
        visit: null,
        sectors: "food-land",
      }),
      "q=new&shop=abc&sectors=food-land",
    );
  });

  it("treats an empty string as removal", () => {
    assert.equal(applyUrlUpdates("q=old", { q: "" }), "");
  });
});

describe("clearFilterUpdates", () => {
  it("removes every filter but keeps the selection, camera, layer and unknown params", () => {
    assert.equal(
      applyUrlUpdates(
        "q=x&attributes=a&visit=1&sectors=food-land&collab=1&offers=referrals" +
          "&needs=storage-space&shop=abc&lng=-83.05&lat=42.35&zoom=12" +
          "&layer=zip&other=1",
        clearFilterUpdates(),
      ),
      "shop=abc&lng=-83.05&lat=42.35&zoom=12&layer=zip&other=1",
    );
  });
});
