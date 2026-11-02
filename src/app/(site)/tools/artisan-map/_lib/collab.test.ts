/* eslint-disable @typescript-eslint/no-floating-promises -- node:test `it`/`describe` return promises by design */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COLLABORATION_TAG_BY_SLUG,
  COLLABORATION_TAGS,
  collaborationTagSlug,
} from "~/lib/constants/collaboration-tags";

import {
  countCollabTags,
  parseCollabTags,
  serializeCollabTags,
  toggleCollabTag,
} from "./collab";
import { mapShop } from "./test-shop";

describe("collaborationTagSlug", () => {
  it("makes URL-safe slugs", () => {
    assert.equal(
      collaborationTagSlug("Shipping & fulfillment"),
      "shipping-fulfillment",
    );
    assert.equal(
      collaborationTagSlug("Kitchen or production space"),
      "kitchen-or-production-space",
    );
  });

  it("gives every tag a unique slug that maps back to it", () => {
    assert.equal(COLLABORATION_TAG_BY_SLUG.size, COLLABORATION_TAGS.length);
    for (const tag of COLLABORATION_TAGS) {
      const slug = collaborationTagSlug(tag);
      assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
      assert.equal(COLLABORATION_TAG_BY_SLUG.get(slug), tag);
    }
  });
});

describe("parseCollabTags / serializeCollabTags", () => {
  it("reads slugs into tags in canonical order, dropping unknowns", () => {
    assert.deepEqual(
      parseCollabTags("referrals, local-delivery,bogus,referrals,,"),
      ["Local delivery", "Referrals"],
    );
    assert.deepEqual(parseCollabTags(null), []);
    // Labels aren't slugs.
    assert.deepEqual(parseCollabTags("Local delivery"), []);
  });

  it("writes slugs, or null for none", () => {
    assert.equal(
      serializeCollabTags(["Referrals", "Shipping & fulfillment"]),
      "shipping-fulfillment,referrals",
    );
    assert.equal(serializeCollabTags([]), null);
  });

  it("round-trips", () => {
    const tags = [...COLLABORATION_TAGS];
    assert.deepEqual(parseCollabTags(serializeCollabTags(tags)), tags);
  });
});

describe("toggleCollabTag", () => {
  it("adds and removes, keeping canonical order", () => {
    assert.deepEqual(toggleCollabTag(["Referrals"], "Local delivery", true), [
      "Local delivery",
      "Referrals",
    ]);
    assert.deepEqual(
      toggleCollabTag(["Local delivery", "Referrals"], "Referrals", false),
      ["Local delivery"],
    );
    assert.deepEqual(toggleCollabTag(["Referrals"], "Referrals", true), [
      "Referrals",
    ]);
  });
});

describe("countCollabTags", () => {
  it("counts each side separately, every tag present", () => {
    const shops = [
      mapShop({
        collab: {
          offerTags: ["Local delivery", "Local delivery"],
          needTags: ["Referrals"],
          offers: null,
          needs: null,
        },
      }),
      mapShop({
        collab: {
          offerTags: ["Local delivery"],
          needTags: [],
          offers: "Vans",
          needs: null,
        },
      }),
      mapShop(),
    ];
    const offers = countCollabTags(shops, "offerTags");
    assert.equal(offers.size, COLLABORATION_TAGS.length);
    assert.equal(offers.get("Local delivery"), 2);
    assert.equal(offers.get("Referrals"), 0);
    assert.equal(countCollabTags(shops, "needTags").get("Referrals"), 1);
  });
});
