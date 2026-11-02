import type { MapShop } from "./types";
import { toDisplaySectors } from "~/lib/constants/shop-sectors";

/** A sector list like the map page passes down, ending with "Other". */
export const TEST_SECTORS = toDisplaySectors([
  {
    slug: "food-land",
    name: "Food & Land",
    shortName: "Food",
    colorKey: "green",
  },
  {
    slug: "clothing-adornment",
    name: "Clothing & Adornment",
    shortName: null,
    colorKey: "plum",
  },
  {
    slug: "art-culture",
    name: "Art & Culture",
    shortName: "Art",
    colorKey: "retired-color",
  },
]);

export const TEST_SLUGS = TEST_SECTORS.map((sector) => sector.slug);

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
