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
