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
  /** Approximate (server-offset) location, or null if not geocoded. */
  location: { lat: number; lng: number } | null;
};
