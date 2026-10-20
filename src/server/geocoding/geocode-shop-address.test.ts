/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  buildGeocodeQuery,
  geocodeLocality,
  syncShopCoordinates,
} from "./geocode-shop-address";

describe("buildGeocodeQuery", () => {
  it("builds a stable lowercase key", () => {
    assert.equal(
      buildGeocodeQuery({
        zip: " 48201 ",
        city: "  Detroit ",
        state: "MI",
        country: "US",
      }),
      "zip=48201|city=detroit|state=mi|country=us",
    );
  });

  it("returns null without zip or city", () => {
    assert.equal(buildGeocodeQuery({}), null);
    assert.equal(
      buildGeocodeQuery({ zip: "", city: "   ", state: "MI", country: "US" }),
      null,
    );
  });

  it("treats blank strings as missing", () => {
    assert.equal(
      buildGeocodeQuery({ zip: "", city: "Detroit", state: "", country: "" }),
      "zip=|city=detroit|state=|country=us",
    );
  });

  it("normalizes US spellings and defaults the country to us", () => {
    const expected = "zip=48201|city=|state=|country=us";
    for (const country of [
      null,
      undefined,
      "",
      "US",
      "USA",
      "usa",
      "United States",
      "united  states of america",
    ]) {
      assert.equal(buildGeocodeQuery({ zip: "48201", country }), expected);
    }
  });

  it("keeps other countries as-is (lowercased)", () => {
    assert.equal(
      buildGeocodeQuery({ city: "Toronto", country: "Canada" }),
      "zip=|city=toronto|state=|country=canada",
    );
  });

  it("truncates US ZIP+4 to 5 digits", () => {
    assert.equal(
      buildGeocodeQuery({ zip: "48201-1234" }),
      "zip=48201|city=|state=|country=us",
    );
  });

  it("collapses inner whitespace", () => {
    assert.equal(
      buildGeocodeQuery({ city: "Grand   Rapids", state: "MI" }),
      buildGeocodeQuery({ city: "grand rapids", state: "mi" }),
    );
  });
});

// ---------------------------------------------------------------------------
// Network-facing helpers, with fetch stubbed. These pay the real 1.1s
// Nominatim throttle between requests, so keep the request count small.
// ---------------------------------------------------------------------------

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function stubFetch(responses: unknown[]): URL[] {
  const calls: URL[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    calls.push(new URL(input instanceof Request ? input.url : input));
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return new Response(JSON.stringify(next ?? []), { status: 200 });
  }) as typeof fetch;
  return calls;
}

describe("geocodeLocality", () => {
  it("falls back from zip to city/state and parses lat/lon", async () => {
    const calls = stubFetch([[], [{ lat: "42.33", lon: "-83.04" }]]);
    const result = await geocodeLocality({
      zip: "00000",
      city: "Detroit",
      state: "MI",
      country: "USA",
    });

    assert.deepEqual(result, { lat: 42.33, lng: -83.04 });
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.searchParams.get("postalcode"), "00000");
    assert.equal(calls[0]?.searchParams.get("city"), null);
    assert.equal(calls[1]?.searchParams.get("city"), "detroit");
    assert.equal(calls[1]?.searchParams.get("state"), "mi");
    for (const call of calls) {
      assert.equal(call.searchParams.get("format"), "jsonv2");
      assert.equal(call.searchParams.get("limit"), "1");
      assert.equal(call.searchParams.get("street"), null);
    }
  });

  it("returns null instead of throwing on network errors", async () => {
    stubFetch([new Error("boom")]);
    assert.equal(await geocodeLocality({ zip: "48201" }), null);
  });
});

describe("syncShopCoordinates", () => {
  type Row = Record<string, unknown>;

  function fakeDb(row: Row | null) {
    const updates: Row[] = [];
    const db = {
      shopAddress: {
        findUnique: async () => row,
        update: async ({ data }: { data: Row }) => {
          updates.push(data);
          return { ...row, ...data };
        },
      },
    } as unknown as Parameters<typeof syncShopCoordinates>[0];
    return { db, updates };
  }

  const base = {
    id: "addr_1",
    zip: "48201",
    city: "Detroit",
    state: "MI",
    country: "US",
    latitude: null,
    longitude: null,
    geocodeQuery: null,
  };

  it("returns no_address when the shop has no address row", async () => {
    const { db } = fakeDb(null);
    assert.equal(await syncShopCoordinates(db, "shop_1"), "no_address");
  });

  it("skips the network when the query is unchanged", async () => {
    const calls = stubFetch([]);
    const { db, updates } = fakeDb({
      ...base,
      geocodeQuery: "zip=48201|city=detroit|state=mi|country=us",
      latitude: 1,
      longitude: 2,
    });
    assert.equal(await syncShopCoordinates(db, "shop_1"), "unchanged");
    assert.equal(calls.length, 0);
    assert.equal(updates.length, 0);
  });

  it("clears coordinates when the locality is removed", async () => {
    const { db, updates } = fakeDb({
      ...base,
      zip: "",
      city: " ",
      latitude: 1,
      longitude: 2,
      geocodeQuery: "zip=48201|city=detroit|state=mi|country=us",
    });
    assert.equal(await syncShopCoordinates(db, "shop_1"), "cleared");
    assert.equal(updates[0]?.latitude, null);
    assert.equal(updates[0]?.geocodeQuery, null);
  });

  it("stores the query on not_found so it is not re-queried", async () => {
    stubFetch([[], []]);
    const { db, updates } = fakeDb(base);
    assert.equal(await syncShopCoordinates(db, "shop_1"), "not_found");
    assert.equal(
      updates[0]?.geocodeQuery,
      "zip=48201|city=detroit|state=mi|country=us",
    );
    assert.equal(updates[0]?.latitude, null);
  });
});
