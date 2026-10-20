export type MapShop = {
  id: string;
  name: string;
  ownerName: string;
  logoPhoto: string | null;
  ownerPhoto: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  attributeTags: string[];
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
};
