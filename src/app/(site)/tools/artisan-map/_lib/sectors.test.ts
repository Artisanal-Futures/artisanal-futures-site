/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SHOP_SECTOR_IDS } from "~/lib/constants/shop-sectors";

import {
  countSectors,
  nextSectors,
  parseSectors,
  serializeSectors,
  visibleSectorIds,
} from "./sectors";

describe("nextSectors", () => {
  it("solos the clicked sector from all", () => {
    assert.deepEqual(nextSectors([], "food-farming"), ["food-farming"]);
  });

  it("toggles a sector in, in canonical order", () => {
    assert.deepEqual(nextSectors(["food-farming"], "apparel"), [
      "apparel",
      "food-farming",
    ]);
  });

  it("toggles a sector out", () => {
    assert.deepEqual(nextSectors(["apparel", "food-farming"], "apparel"), [
      "food-farming",
    ]);
  });

  it("returns to all when the last sector is deselected", () => {
    assert.deepEqual(nextSectors(["apparel"], "apparel"), []);
  });

  it("returns to all once every sector is selected", () => {
    const allButOne = SHOP_SECTOR_IDS.filter((id) => id !== "other");
    assert.deepEqual(nextSectors(allButOne, "other"), []);
  });

  it("treats every visible sector as all", () => {
    assert.deepEqual(
      nextSectors(["apparel"], "jewelry", ["apparel", "jewelry"]),
      [],
    );
    assert.deepEqual(
      nextSectors(["apparel"], "jewelry", ["apparel", "jewelry", "other"]),
      ["apparel", "jewelry"],
    );
  });
});

describe("countSectors", () => {
  it("has every sector, in order, with zeros for an empty list", () => {
    const counts = countSectors([]);
    assert.deepEqual([...counts.keys()], [...SHOP_SECTOR_IDS]);
    assert.ok([...counts.values()].every((n) => n === 0));
  });

  it("counts shops per sector", () => {
    const counts = countSectors([
      { sector: "apparel" },
      { sector: "apparel" },
      { sector: "other" },
    ]);
    assert.equal(counts.get("apparel"), 2);
    assert.equal(counts.get("other"), 1);
    assert.equal(counts.get("education"), 0);
  });
});

describe("visibleSectorIds", () => {
  it("keeps sectors with shops plus selected ones, in order", () => {
    const totals = countSectors([{ sector: "other" }, { sector: "apparel" }]);
    assert.deepEqual(visibleSectorIds(totals, []), ["apparel", "other"]);
    assert.deepEqual(visibleSectorIds(totals, ["education"]), [
      "apparel",
      "education",
      "other",
    ]);
  });
});

describe("parseSectors", () => {
  it("is all for a missing or empty param", () => {
    assert.deepEqual(parseSectors(null), []);
    assert.deepEqual(parseSectors(""), []);
  });

  it("drops unknown ids and duplicates and sorts canonically", () => {
    assert.deepEqual(
      parseSectors("food-farming, nope,apparel,food-farming,,"),
      ["apparel", "food-farming"],
    );
  });

  it("collapses a list of every sector to all", () => {
    assert.deepEqual(parseSectors(SHOP_SECTOR_IDS.join(",")), []);
  });
});

describe("serializeSectors", () => {
  it("is null for all", () => {
    assert.equal(serializeSectors([]), null);
  });

  it("round-trips through parseSectors", () => {
    const value = serializeSectors(["food-farming", "art-design"]);
    assert.equal(value, "art-design,food-farming");
    assert.deepEqual(parseSectors(value), ["art-design", "food-farming"]);
  });
});
