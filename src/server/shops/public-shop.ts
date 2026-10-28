import type { Prisma } from "generated/prisma";

/**
 * Public address select. Deliberately lists only the original columns so the
 * raw geocoding columns (latitude, longitude, geocodeQuery, geocodedAt) never
 * leak through public endpoints. The map uses `getMapLocations`, which
 * returns jittered coordinates for anything but a geocoded storefront.
 *
 * The street columns are still selected here; every public endpoint must pass
 * the result through `toPublicAddress` before returning it.
 */
export const publicAddressSelect = {
  id: true,
  address: true,
  additional: true,
  city: true,
  state: true,
  zip: true,
  country: true,
  street: true,
  shopId: true,
} as const satisfies Prisma.ShopAddressSelect;

/**
 * The Shop columns a public endpoint may return. `shop.get` used to spread the
 * whole row, which leaked the owner id, old slugs, admin SEO overrides and the
 * product-sync configuration to anyone who knew a slug. An allow-list means a
 * new column stays private until someone deliberately adds it here.
 */
export const shopPublicSelect = {
  id: true,
  slug: true,
  name: true,
  ownerName: true,
  bio: true,
  description: true,
  ownerPhoto: true,
  logoPhoto: true,
  coverPhoto: true,
  phone: true,
  email: true,
  website: true,
  socialLinks: true,
  attributeTags: true,
  createdAt: true,
  isPublic: true,
  locationType: true,
  collabOffers: true,
  collabOfferTags: true,
  collabNeeds: true,
  collabNeedTags: true,
  address: { select: publicAddressSelect },
} as const satisfies Prisma.ShopSelect;

/** Shop columns that must never appear in `shopPublicSelect` (checked by test). */
export const PRIVATE_SHOP_FIELDS = [
  "ownerId",
  "previousSlugs",
  "updatedAt",
  "seoTitle",
  "seoDescription",
  "seoImage",
  "seoNoIndex",
  "syncPlatform",
  "syncEnabled",
  "syncUrl",
  "allowInsecureOrigin",
  "lastSyncedAt",
] as const satisfies readonly (keyof Prisma.ShopSelect)[];
