/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findSector,
  OTHER_SECTOR,
  sectorColor,
} from "~/lib/constants/shop-sectors";

import {
  countSectors,
  nextSectors,
  parseSectors,
  serializeSectors,
  visibleSectorSlugs,
} from "./sectors";
import { TEST_SECTORS, TEST_SLUGS } from "./test-shop";

describe("nextSectors", () => {
  it("solos the clicked sector from all", () => {
    assert.deepEqual(nextSectors([], "food-land", TEST_SLUGS), ["food-land"]);
  });

  it("toggles a sector in, in canonical order", () => {
    assert.deepEqual(nextSectors(["art-culture"], "food-land", TEST_SLUGS), [
      "food-land",
      "art-culture",
    ]);
  });

  it("toggles a sector out", () => {
    assert.deepEqual(
      nextSectors(["food-land", "art-culture"], "food-land", TEST_SLUGS),
      ["art-culture"],
    );
  });

  it("returns to all when the last sector is deselected", () => {
    assert.deepEqual(nextSectors(["food-land"], "food-land", TEST_SLUGS), []);
  });

  it("returns to all once every sector is selected", () => {
    const allButOne = TEST_SLUGS.filter((slug) => slug !== "other");
    assert.deepEqual(nextSectors(allButOne, "other", TEST_SLUGS), []);
  });

  it("treats every visible sector as all", () => {
    assert.deepEqual(
      nextSectors(["food-land"], "art-culture", TEST_SLUGS, [
        "food-land",
        "art-culture",
      ]),
      [],
    );
    assert.deepEqual(
      nextSectors(["food-land"], "art-culture", TEST_SLUGS, [
        "food-land",
        "art-culture",
        "other",
      ]),
      ["food-land", "art-culture"],
    );
  });
});

describe("countSectors", () => {
  it("has every sector, in order, with zeros for an empty list", () => {
    const counts = countSectors([], TEST_SLUGS);
    assert.deepEqual([...counts.keys()], TEST_SLUGS);
    assert.ok([...counts.values()].every((n) => n === 0));
  });

  it("counts shops per sector", () => {
    const counts = countSectors(
      [
        { sector: "food-land" },
        { sector: "food-land" },
        { sector: "other" },
        { sector: "not-in-the-list" },
      ],
      TEST_SLUGS,
    );
    assert.equal(counts.get("food-land"), 2);
    assert.equal(counts.get("other"), 1);
    assert.equal(counts.get("art-culture"), 0);
    assert.equal(counts.has("not-in-the-list"), false);
  });
});

describe("visibleSectorSlugs", () => {
  it("keeps sectors with shops plus selected ones, in order", () => {
    const totals = countSectors(
      [{ sector: "other" }, { sector: "food-land" }],
      TEST_SLUGS,
    );
    assert.deepEqual(visibleSectorSlugs(totals, [], TEST_SLUGS), [
      "food-land",
      "other",
    ]);
    assert.deepEqual(visibleSectorSlugs(totals, ["art-culture"], TEST_SLUGS), [
      "food-land",
      "art-culture",
      "other",
    ]);
  });
});

describe("parseSectors", () => {
  it("is all for a missing or empty param", () => {
    assert.deepEqual(parseSectors(null, TEST_SLUGS), []);
    assert.deepEqual(parseSectors("", TEST_SLUGS), []);
  });

  it("drops slugs not in the list and duplicates, and sorts canonically", () => {
    assert.deepEqual(
      parseSectors("art-culture, nope,food-land,art-culture,,", TEST_SLUGS),
      ["food-land", "art-culture"],
    );
  });

  it("drops a deleted sector's slug from an old link", () => {
    assert.deepEqual(parseSectors("art-culture,apparel", TEST_SLUGS), [
      "art-culture",
    ]);
  });

  it("collapses a list of every sector to all", () => {
    assert.deepEqual(parseSectors(TEST_SLUGS.join(","), TEST_SLUGS), []);
  });
});

describe("serializeSectors", () => {
  it("is null for all", () => {
    assert.equal(serializeSectors([], TEST_SLUGS), null);
  });

  it("round-trips through parseSectors", () => {
    const value = serializeSectors(["art-culture", "food-land"], TEST_SLUGS);
    assert.equal(value, "food-land,art-culture");
    assert.deepEqual(parseSectors(value, TEST_SLUGS), [
      "food-land",
      "art-culture",
    ]);
  });
});

describe("display sectors", () => {
  it("ends with the synthetic Other, not a database row", () => {
    assert.equal(TEST_SECTORS.at(-1), OTHER_SECTOR);
  });

  it("falls back to the name for a missing short name", () => {
    assert.equal(
      findSector(TEST_SECTORS, "clothing-adornment").shortName,
      "Clothing & Adornment",
    );
  });

  it("shows an unknown slug as Other", () => {
    assert.equal(findSector(TEST_SECTORS, "apparel"), OTHER_SECTOR);
  });

  it("gives an unknown color key the neutral color", () => {
    assert.deepEqual(sectorColor("retired-color"), OTHER_SECTOR.color);
    assert.deepEqual(
      findSector(TEST_SECTORS, "art-culture").color,
      OTHER_SECTOR.color,
    );
    assert.deepEqual(sectorColor("plum"), {
      light: "#a5438d",
      dark: "#e88ed1",
    });
  });
});
