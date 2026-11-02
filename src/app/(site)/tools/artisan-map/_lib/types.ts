import type { CollaborationTag } from "~/lib/constants/collaboration-tags";

/** A shop's public "Open to collaborate" listing. */
export type MapShopCollab = {
  /** Kinds of help the shop can offer. */
  offerTags: CollaborationTag[];
  /** Kinds of help the shop is looking for. */
  needTags: CollaborationTag[];
  offers: string | null;
  needs: string | null;
};

export type MapShop = {
  id: string;
  /** Public profile slug; null until one is generated. */
  slug: string | null;
  name: string;
  ownerName: string;
  logoPhoto: string | null;
  ownerPhoto: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  attributeTags: string[];
  /** Sector slug, which colors the pin; "other" when the shop has none. */
  sector: string;
  /** "City, ST", one part, or null. Never a street address. */
  locality: string | null;
  /**
   * Exact for a storefront geocoded from its street, otherwise the
   * server-offset approximate location; null if not geocoded.
   */
  location: { lat: number; lng: number } | null;
  /** "exact" only for a storefront pinned at its street address. */
  precision: "exact" | "approximate";
  /** Public street line, only for an exact (storefront) pin. */
  streetAddress?: string | null;
  /** Public products listed by the shop. */
  productCount: number;
  /** Public services listed by the shop. */
  serviceCount: number;
  /** Joined within the last 30 days. */
  isNew: boolean;
  /** Open-to-collaborate listing; null when the shop hasn't filled one in. */
  collab: MapShopCollab | null;
};
