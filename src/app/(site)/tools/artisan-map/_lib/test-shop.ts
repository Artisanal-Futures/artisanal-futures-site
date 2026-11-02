import type { MapShop } from "./types";

/** A minimal `MapShop` for tests; override only what a case cares about. */
export function mapShop(overrides: Partial<MapShop> = {}): MapShop {
  return {
    id: "shop",
    slug: null,
    name: "Shop",
    ownerName: "Owner",
    logoPhoto: null,
    ownerPhoto: null,
    website: null,
    email: null,
    phone: null,
    attributeTags: [],
    sector: "other",
    locality: null,
    location: null,
    precision: "approximate",
    streetAddress: null,
    productCount: 0,
    serviceCount: 0,
    isNew: false,
    collab: null,
    ...overrides,
  };
}
