/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  blankToNull,
  formatLocality,
  offsetLocation,
} from "./approximate-location";

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371.0088;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

describe("blankToNull", () => {
  it("trims and nulls blanks", () => {
    assert.equal(blankToNull("  hello "), "hello");
    assert.equal(blankToNull(""), null);
    assert.equal(blankToNull("   "), null);
    assert.equal(blankToNull(null), null);
    assert.equal(blankToNull(undefined), null);
  });
});

describe("formatLocality", () => {
  it("combines city and state", () => {
    assert.equal(formatLocality("Detroit", "MI"), "Detroit, MI");
    assert.equal(formatLocality(" Detroit ", " MI "), "Detroit, MI");
  });

  it("handles a single part", () => {
    assert.equal(formatLocality("Detroit", ""), "Detroit");
    assert.equal(formatLocality(null, "MI"), "MI");
  });

  it("returns null when empty", () => {
    assert.equal(formatLocality("", "  "), null);
    assert.equal(formatLocality(undefined, null), null);
  });
});

describe("offsetLocation", () => {
  it("is deterministic", () => {
    assert.deepEqual(
      offsetLocation("shop_1", 42.33, -83.04),
      offsetLocation("shop_1", 42.33, -83.04),
    );
  });

  it("keeps the offset within 0.4-1.2 km", () => {
    const origins = [
      { lat: 42.33, lng: -83.04 },
      { lat: 64.84, lng: -147.72 },
      { lat: 25.76, lng: -80.19 },
    ];
    for (const origin of origins) {
      for (let i = 0; i < 200; i++) {
        const id = `c${Math.random().toString(36).slice(2)}${i}`;
        const moved = offsetLocation(id, origin.lat, origin.lng);
        const km = haversineKm(origin, moved);
        // 5-decimal rounding adds at most ~1m of error.
        assert.ok(km >= 0.398 && km <= 1.202, `${id}: ${km} km`);
      }
    }
  });

  it("separates different shops in the same ZIP", () => {
    const a = offsetLocation("shop_a", 42.33, -83.04);
    const b = offsetLocation("shop_b", 42.33, -83.04);
    assert.notDeepEqual(a, b);

    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const p = offsetLocation(`shop_${i}`, 42.33, -83.04);
      seen.add(`${p.lat},${p.lng}`);
    }
    assert.equal(seen.size, 100);
  });

  it("rounds to 5 decimals", () => {
    const p = offsetLocation("shop_1", 42.331234567, -83.041234567);
    assert.equal(p.lat, Math.round(p.lat * 1e5) / 1e5);
    assert.equal(p.lng, Math.round(p.lng * 1e5) / 1e5);
  });
});
