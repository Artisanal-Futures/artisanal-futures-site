/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { LngLatBoundsTuple } from "./boundaries";

import {
  BOUNDARY_LAYER_IDS,
  BOUNDARY_LAYERS,
  DETROIT_BOUNDS,
  isOffDetroit,
  parseBoundaryLayer,
} from "./boundaries";

describe("parseBoundaryLayer", () => {
  it("accepts the known ids, trimmed", () => {
    for (const id of BOUNDARY_LAYER_IDS) {
      assert.equal(parseBoundaryLayer(id), id);
    }
    assert.equal(parseBoundaryLayer(" zip "), "zip");
  });

  it("rejects everything else", () => {
    assert.equal(parseBoundaryLayer(null), null);
    assert.equal(parseBoundaryLayer(""), null);
    assert.equal(parseBoundaryLayer("Council"), null);
    assert.equal(parseBoundaryLayer("toString"), null);
  });
});

describe("BOUNDARY_LAYERS", () => {
  it("has one versioned static file per layer", () => {
    for (const id of BOUNDARY_LAYER_IDS) {
      const layer = BOUNDARY_LAYERS[id];
      assert.equal(layer.id, id);
      assert.match(layer.url, /^\/map\/boundaries\/detroit-.+\.v\d+\.geojson$/);
    }
  });
});

describe("isOffDetroit", () => {
  const downtown: LngLatBoundsTuple = [
    [-83.08, 42.32],
    [-83.02, 42.35],
  ];
  const chicago: LngLatBoundsTuple = [
    [-87.75, 41.8],
    [-87.55, 41.95],
  ];

  it("stays put when Detroit is in view and readable", () => {
    assert.equal(isOffDetroit(downtown, 13), false);
    assert.equal(isOffDetroit(DETROIT_BOUNDS, 10), false);
  });

  it("is off when Detroit is out of view", () => {
    assert.equal(isOffDetroit(chicago, 12), true);
  });

  it("is off when zoomed out too far, even over Detroit", () => {
    assert.equal(isOffDetroit(DETROIT_BOUNDS, 5), true);
  });
});
