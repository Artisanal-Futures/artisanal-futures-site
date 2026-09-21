/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Papa from "papaparse";

import {
  boolean,
  httpsUrl,
  LIST_SEPARATOR,
  MAX_IMPORT_ROWS,
  normalizeHeader,
  pipeList,
  positiveInt,
  priceDollarsToCents,
} from "./columns";
import {
  checkHeaders,
  getColumns,
  parseProductRow,
  parseServiceRow,
} from "./parse-rows";
import { PRODUCT_COLUMNS } from "./product-columns";
import { SERVICE_COLUMNS } from "./service-columns";
import { buildTemplateCsv, templateFileName } from "./template";

describe("csv-import library", () => {
  describe("1. Price parser (priceDollarsToCents)", () => {
    it('"24.99" parses to 2499 cents', () => {
      const result = priceDollarsToCents.safeParse("24.99");
      assert.ok(result.success);
      assert.equal(result.data, 2499);
    });

    it('"$1,234.50" parses to 123450 cents', () => {
      const result = priceDollarsToCents.safeParse("$1,234.50");
      assert.ok(result.success);
      assert.equal(result.data, 123450);
    });

    it("Empty string parses to null", () => {
      const result = priceDollarsToCents.safeParse("");
      assert.ok(result.success);
      assert.equal(result.data, null);
    });

    it('"abc" fails', () => {
      const result = priceDollarsToCents.safeParse("abc");
      assert.ok(!result.success);
    });

    it('"-5" fails', () => {
      const result = priceDollarsToCents.safeParse("-5");
      assert.ok(!result.success);
    });

    it('"2000000" (over 1,000,000 dollars) fails', () => {
      const result = priceDollarsToCents.safeParse("2000000");
      assert.ok(!result.success);
    });
  });

  describe("2. Boolean parser", () => {
    it('"true" parses to true', () => {
      const parser = boolean(false);
      const result = parser.safeParse("true");
      assert.ok(result.success);
      assert.equal(result.data, true);
    });

    it('"YES" parses to true', () => {
      const parser = boolean(false);
      const result = parser.safeParse("YES");
      assert.ok(result.success);
      assert.equal(result.data, true);
    });

    it('"1" parses to true', () => {
      const parser = boolean(false);
      const result = parser.safeParse("1");
      assert.ok(result.success);
      assert.equal(result.data, true);
    });

    it('"y" parses to true', () => {
      const parser = boolean(false);
      const result = parser.safeParse("y");
      assert.ok(result.success);
      assert.equal(result.data, true);
    });

    it('"false" parses to false', () => {
      const parser = boolean(true);
      const result = parser.safeParse("false");
      assert.ok(result.success);
      assert.equal(result.data, false);
    });

    it('"No" parses to false', () => {
      const parser = boolean(true);
      const result = parser.safeParse("No");
      assert.ok(result.success);
      assert.equal(result.data, false);
    });

    it('"0" parses to false', () => {
      const parser = boolean(true);
      const result = parser.safeParse("0");
      assert.ok(result.success);
      assert.equal(result.data, false);
    });

    it('"n" parses to false', () => {
      const parser = boolean(true);
      const result = parser.safeParse("n");
      assert.ok(result.success);
      assert.equal(result.data, false);
    });

    it("Empty string uses default value", () => {
      const parserTrue = boolean(true);
      const resultTrue = parserTrue.safeParse("");
      assert.ok(resultTrue.success);
      assert.equal(resultTrue.data, true);

      const parserFalse = boolean(false);
      const resultFalse = parserFalse.safeParse("");
      assert.ok(resultFalse.success);
      assert.equal(resultFalse.data, false);
    });

    it('"maybe" fails', () => {
      const parser = boolean(true);
      const result = parser.safeParse("maybe");
      assert.ok(!result.success);
    });
  });

  describe("3. pipeList parser", () => {
    it('"a | b|c||a" parses to ["a","b","c"] (trimmed, empties dropped, deduped)', () => {
      const result = pipeList.safeParse("a | b|c||a");
      assert.ok(result.success);
      assert.deepEqual(result.data, ["a", "b", "c"]);
    });

    it("Empty string parses to []", () => {
      const result = pipeList.safeParse("");
      assert.ok(result.success);
      assert.deepEqual(result.data, []);
    });
  });

  describe("4. httpsUrl parser", () => {
    it('"https://example.com/x.jpg" is valid', () => {
      const result = httpsUrl.safeParse("https://example.com/x.jpg");
      assert.ok(result.success);
      assert.equal(result.data, "https://example.com/x.jpg");
    });

    it('"http://example.com/x.jpg" fails', () => {
      const result = httpsUrl.safeParse("http://example.com/x.jpg");
      assert.ok(!result.success);
    });

    it('"not a url" fails', () => {
      const result = httpsUrl.safeParse("not a url");
      assert.ok(!result.success);
    });

    it("Empty string parses to null", () => {
      const result = httpsUrl.safeParse("");
      assert.ok(result.success);
      assert.equal(result.data, null);
    });
  });

  describe("5. positiveInt parser", () => {
    it('"120" parses to 120', () => {
      const result = positiveInt.safeParse("120");
      assert.ok(result.success);
      assert.equal(result.data, 120);
    });

    it('"-5" fails', () => {
      const result = positiveInt.safeParse("-5");
      assert.ok(!result.success);
    });

    it('"1.5" fails', () => {
      const result = positiveInt.safeParse("1.5");
      assert.ok(!result.success);
    });

    it("Empty string parses to null", () => {
      const result = positiveInt.safeParse("");
      assert.ok(result.success);
      assert.equal(result.data, null);
    });
  });

  describe("6. normalizeHeader", () => {
    it('"﻿Image URL" normalizes to "image_url"', () => {
      const result = normalizeHeader("﻿Image URL");
      assert.equal(result, "image_url");
    });

    it('"  Material-Tags " normalizes to "material_tags"', () => {
      const result = normalizeHeader("  Material-Tags ");
      assert.equal(result, "material_tags");
    });

    it('"NAME" normalizes to "name"', () => {
      const result = normalizeHeader("NAME");
      assert.equal(result, "name");
    });
  });

  describe("7. checkHeaders", () => {
    it('checkHeaders("products", ["name"]) reports missing description and other required columns', () => {
      const result = checkHeaders("products", ["name"]);
      assert.ok(result.missing.includes("description"));
      assert.deepEqual(result.unknown, []);
    });

    it('checkHeaders("products", ["name","description","foo"]) reports foo as unknown', () => {
      const result = checkHeaders("products", ["name", "description", "foo"]);
      assert.deepEqual(result.missing, []);
      assert.deepEqual(result.unknown, ["foo"]);
    });
  });

  describe("8. parseProductRow", () => {
    it("Minimal row with name and description passes with defaults", () => {
      const result = parseProductRow({
        name: "Mug",
        description: "A mug",
      });
      assert.ok(result.ok);
      if (result.ok) {
        assert.equal(result.data.name, "Mug");
        assert.equal(result.data.description, "A mug");
        assert.equal(result.data.priceInCents, null);
        assert.equal(result.data.sku, null);
        assert.deepEqual(result.data.categories, []);
        assert.equal(result.data.isPublic, true);
      }
    });

    it('Row with empty name fails with error starting with "name:"', () => {
      const result = parseProductRow({
        name: "",
        description: "x",
      });
      assert.ok(!result.ok);
      if (!result.ok) {
        assert.ok(result.errors[0]?.startsWith("name:"));
      }
    });

    it("Row with invalid price and image_url has two errors", () => {
      const result = parseProductRow({
        name: "Mug",
        description: "d",
        price: "abc",
        image_url: "http://x.com/a.jpg",
      });
      assert.ok(!result.ok);
      if (!result.ok) {
        assert.equal(result.errors.length, 2);
        const errorTexts = result.errors.join(" | ");
        assert.ok(errorTexts.includes("price:"));
        assert.ok(errorTexts.includes("image_url:"));
      }
    });
  });

  describe("9. parseServiceRow", () => {
    it("Minimal row passes with defaults", () => {
      const result = parseServiceRow({
        name: "Pottery Workshop",
        description: "Learn pottery",
      });
      assert.ok(result.ok);
      if (result.ok) {
        assert.equal(result.data.durationInMinutes, null);
        assert.equal(result.data.locationType, null);
        assert.equal(result.data.isPublic, true);
      }
    });

    it("Row with negative duration fails", () => {
      const result = parseServiceRow({
        name: "Workshop",
        description: "A workshop",
        duration_minutes: "-5",
      });
      assert.ok(!result.ok);
    });
  });

  describe("10. Template round-trip", () => {
    it("Products template parses correctly and round-trips", () => {
      const csv = buildTemplateCsv("products");
      const parsed = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: normalizeHeader,
      });

      assert.equal(parsed.errors.length, 0);
      assert.deepEqual(
        parsed.meta.fields,
        PRODUCT_COLUMNS.map((col) => col.header),
      );
      assert.equal(parsed.data.length, 2);

      // Every row should parse successfully
      for (const row of parsed.data) {
        const result = parseProductRow(
          row as Record<string, string | undefined>,
        );
        assert.ok(result.ok, `Row failed to parse: ${JSON.stringify(result)}`);
      }
    });

    it("Services template parses correctly and round-trips", () => {
      const csv = buildTemplateCsv("services");
      const parsed = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: normalizeHeader,
      });

      assert.equal(parsed.errors.length, 0);
      assert.deepEqual(
        parsed.meta.fields,
        SERVICE_COLUMNS.map((col) => col.header),
      );
      assert.equal(parsed.data.length, 2);

      // Every row should parse successfully
      for (const row of parsed.data) {
        const result = parseServiceRow(
          row as Record<string, string | undefined>,
        );
        assert.ok(result.ok, `Row failed to parse: ${JSON.stringify(result)}`);
      }
    });

    it('templateFileName("products") returns "products-template.csv"', () => {
      const result = templateFileName("products");
      assert.equal(result, "products-template.csv");
    });

    it('templateFileName("services") returns "services-template.csv"', () => {
      const result = templateFileName("services");
      assert.equal(result, "services-template.csv");
    });
  });

  describe("Constants and exports", () => {
    it("MAX_IMPORT_ROWS is exported and is a number", () => {
      assert.ok(typeof MAX_IMPORT_ROWS === "number");
      assert.ok(MAX_IMPORT_ROWS > 0);
    });

    it("LIST_SEPARATOR is exported and equals '|'", () => {
      assert.equal(LIST_SEPARATOR, "|");
    });

    it("getColumns returns correct columns for each type", () => {
      const productCols = getColumns("products");
      assert.deepEqual(productCols, PRODUCT_COLUMNS);

      const serviceCols = getColumns("services");
      assert.deepEqual(serviceCols, SERVICE_COLUMNS);
    });
  });
});
