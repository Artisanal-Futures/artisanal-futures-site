/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PRIVATE_SHOP_FIELDS, shopPublicSelect } from "./public-shop";

describe("shopPublicSelect", () => {
  it("selects no private shop column", () => {
    const keys = Object.keys(shopPublicSelect);
    for (const field of PRIVATE_SHOP_FIELDS) {
      assert.ok(!keys.includes(field), `${field} must stay private`);
    }
  });

  it("includes the public collaboration fields", () => {
    for (const field of [
      "collabOffers",
      "collabOfferTags",
      "collabNeeds",
      "collabNeedTags",
    ]) {
      assert.equal(
        shopPublicSelect[field as keyof typeof shopPublicSelect],
        true,
      );
    }
  });

  it("selects no geocoding column from the address", () => {
    const keys = Object.keys(shopPublicSelect.address.select);
    for (const key of keys) {
      assert.ok(
        !/^(latitude|longitude|geocode)/.test(key),
        `${key} must not be public`,
      );
    }
  });
});
