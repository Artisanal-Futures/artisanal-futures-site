/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { test } from "node:test";

import { artisanMapPath } from "./paths";

test("artisanMapPath omits empty params and encodes values", () => {
  assert.equal(artisanMapPath({}), "/tools/artisan-map");
  assert.equal(
    artisanMapPath({ q: "", category: "Candles & Soap", shop: null }),
    "/tools/artisan-map?category=Candles%20%26%20Soap",
  );
  assert.equal(
    artisanMapPath({ q: "tea cup", shop: "abc" }),
    "/tools/artisan-map?q=tea%20cup&shop=abc",
  );
});
