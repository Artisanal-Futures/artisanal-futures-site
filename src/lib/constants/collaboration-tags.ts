/**
 * Kinds of mutual aid a shop can offer or look for (`Shop.collabOfferTags` /
 * `collabNeedTags`). Stored as these labels, like `attributeTags`, so renaming
 * one orphans existing rows.
 */
export const COLLABORATION_TAGS = [
  "Local delivery",
  "Shipping & fulfillment",
  "Storage space",
  "Kitchen or production space",
  "Retail or event space",
  "Equipment sharing",
  "Packaging & supplies",
  "Bulk buying & sourcing",
  "Skills & labor",
  "Marketing & cross-promotion",
  "Referrals",
  "Events & pop-ups",
] as const;

export type CollaborationTag = (typeof COLLABORATION_TAGS)[number];

/** Max characters of each collaboration note (`collabOffers` / `collabNeeds`). */
export const COLLABORATION_TEXT_MAX = 500;

export const isCollaborationTag = (value: string): value is CollaborationTag =>
  (COLLABORATION_TAGS as readonly string[]).includes(value);

/**
 * URL-safe slug for a tag ("Shipping & fulfillment" → "shipping-fulfillment"),
 * so the Artisan Map's `offers`/`needs` params stay readable. Derived from the
 * label, so renaming a tag changes its slug as well as orphaning rows.
 */
export const collaborationTagSlug = (tag: CollaborationTag): string =>
  tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Slug → tag, for reading `collaborationTagSlug` values back. */
export const COLLABORATION_TAG_BY_SLUG: ReadonlyMap<string, CollaborationTag> =
  new Map(COLLABORATION_TAGS.map((tag) => [collaborationTagSlug(tag), tag]));
