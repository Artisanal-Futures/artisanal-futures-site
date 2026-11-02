/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { OTHER_SECTOR, sectorColor } from "~/lib/constants/shop-sectors";

import { TEST_SECTORS } from "../_lib/test-shop";
import { sectorColorExpr } from "./map-style";

describe("sectorColorExpr", () => {
  it("matches each database sector, falling back to Other", () => {
    assert.deepEqual(sectorColorExpr("light", TEST_SECTORS), [
      "match",
      ["get", "sector"],
      "food-land",
      sectorColor("green").light,
      "clothing-adornment",
      sectorColor("plum").light,
      "art-culture",
      OTHER_SECTOR.color.light,
      OTHER_SECTOR.color.light,
    ]);
  });

  it("is a plain color, not an invalid match, with no database sectors", () => {
    assert.equal(sectorColorExpr("dark", []), OTHER_SECTOR.color.dark);
    assert.equal(
      sectorColorExpr("dark", [OTHER_SECTOR]),
      OTHER_SECTOR.color.dark,
    );
  });
});
