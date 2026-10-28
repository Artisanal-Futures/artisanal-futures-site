/**
 * Pure builder for the `artisanalfutures.shop-profile/v1` payload
 * (`GET /api/v1/shop-profile`). No database, no `next/*`, no env: the loader
 * (`./load.ts`) does the Prisma reads and hands a `ShopProfileSource` in; this
 * shapes it into the wire contract so it can be unit-tested.
 *
 * PUBLIC DATA ONLY. Every output object below is built field by field from an
 * explicit allowlist — never spread a source row into the output. The source
 * carries the street lines, real coordinates and `syncUrl` only so the public
 * versions can be derived (`toPublicAddress`, the map's offset pin, the feed's
 * origin); they must never reach the result as-is (see build.test.ts).
 */
import type { NetworkEventInput, NetworkShopInput } from "./network";
import type { ShopCollaborationSource } from "./text";
import type {
  ShopProfileCatalog,
  ShopProfileCatalogSource,
  ShopProfileFullProduct,
  ShopProfileLocationType,
  ShopProfileOverlayProduct,
  ShopProfileService,
  ShopProfileV1,
} from "./types";
import {
  addFullProductImageUrl,
  addFullServiceImageUrl,
} from "~/lib/add-full-image-url";
import { handleImageUrl } from "~/lib/handle-image-url";
import { shopPath } from "~/lib/seo/paths";
import { parseSocialLinks } from "~/lib/social-links";
import {
  blankToNull,
  offsetLocation,
  roundLocation,
} from "~/server/geocoding/approximate-location";
import { toPublicAddress } from "~/server/lib/public-address";

import { buildNetwork } from "./network";
import { plainOrNull, toCollaboration, uniqueStrings } from "./text";
import {
  ABOUT_MAX_CHARS,
  COLLAB_TEXT_MAX_CHARS,
  DESCRIPTION_MAX_CHARS,
  MAX_ITEMS,
  SHOP_PROFILE_SCHEMA,
} from "./types";

// ─── Source shape (what the loader selects) ──────────────────────────────────

export type ShopProfileSourceProduct = {
  name: string;
  description: string;
  priceInCents: number | null;
  currency: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  tags: string[];
  attributeTags: string[];
  materialTags: string[];
  environmentalTags: string[];
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: Date;
  categories: string[];
};

export type ShopProfileSourceService = {
  name: string;
  description: string;
  priceInCents: number | null;
  currency: string | null;
  imageUrl: string | null;
  serviceUrl: string | null;
  durationInMinutes: number | null;
  tags: string[];
  attributeTags: string[];
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: Date;
  categories: string[];
};

export type ShopProfileSource = {
  shop: ShopCollaborationSource & {
    id: string;
    slug: string | null;
    name: string;
    ownerName: string;
    bio: string | null;
    description: string | null;
    website: string | null;
    socialLinks: string[];
    logoPhoto: string | null;
    attributeTags: string[];
    locationType: ShopProfileLocationType;
    syncPlatform: ShopProfileCatalogSource | null;
    syncEnabled: boolean;
    /** Used ONLY to derive `catalog.syncedFrom` (its origin); never emitted. */
    syncUrl: string | null;
    lastSyncedAt: Date | null;
    address: {
      // Street inputs — emitted only through `toPublicAddress`.
      address: string | null;
      additional: string | null;
      street: string | null;
      zip: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      // Real coordinates — emitted only as the map's public pin.
      latitude: number | null;
      longitude: number | null;
      geocodePrecision: string | null;
    } | null;
  };
  /** Public products, already capped by the loader. */
  products: ShopProfileSourceProduct[];
  /** Total public products before any cap (null → count `products`). */
  productTotal: number | null;
  services: ShopProfileSourceService[];
  serviceTotal: number | null;
  /** Other public, indexable shops (the directory candidates). */
  networkShops: NetworkShopInput[];
  /** Upcoming events on public shops. */
  events: NetworkEventInput[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Absolute http(s) URL, or a site-relative path resolved against AF. */
function absoluteUrl(url: string | null | undefined, baseUrl: string) {
  const t = url?.trim();
  if (!t) return null;
  const resolved = /^https?:\/\//i.test(t)
    ? t
    : t.startsWith("/") && !t.startsWith("//")
      ? `${baseUrl}${t}`
      : null;
  if (!resolved) return null;
  // File names can contain spaces; normalise so the URL is valid.
  try {
    return new URL(resolved).href;
  } catch {
    return null;
  }
}

/** Shop photos are bare file names (shop storage), absolute URLs, or site paths. */
function shopImageUrl(image: string | null, baseUrl: string) {
  const t = blankToNull(image);
  if (!t) return null;
  return absoluteUrl(/^(https?:|\/)/.test(t) ? t : handleImageUrl(t), baseUrl);
}

/** Owners type their website freely, so tolerate a missing scheme. */
function normalizeWebsite(website: string | null) {
  const value = blankToNull(website);
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function originOf(url: string | null): string | null {
  const normalized = normalizeWebsite(url);
  if (!normalized) return null;
  try {
    return new URL(normalized).origin;
  } catch {
    return null;
  }
}

const positiveCents = (value: number | null) =>
  value !== null && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null;

const currencyOf = (value: string | null) =>
  blankToNull(value)?.toUpperCase() ?? "USD";

/** Featured first, then newest. */
const catalogOrder = (
  a: { isFeatured: boolean; createdAt: Date },
  b: { isFeatured: boolean; createdAt: Date },
) =>
  Number(b.isFeatured) - Number(a.isFeatured) ||
  b.createdAt.getTime() - a.createdAt.getTime();

// ─── Shop ────────────────────────────────────────────────────────────────────

function buildShop(
  source: ShopProfileSource,
  baseUrl: string,
): ShopProfileV1["shop"] {
  const s = source.shop;
  const address = s.address;

  const publicAddress = toPublicAddress(address, s.locationType);
  const streetAddress =
    s.locationType === "STOREFRONT" && publicAddress
      ? uniqueStrings([
          publicAddress.address ?? "",
          publicAddress.street ?? "",
          publicAddress.additional ?? "",
        ]).join(", ") || null
      : null;

  const city = blankToNull(address?.city);
  const state = blankToNull(address?.state);
  const country = blankToNull(address?.country);

  // The same public pin `shop.getMapLocations` serves: exact only for a
  // storefront geocoded from its street, otherwise the per-shop offset.
  const { latitude, longitude } = address ?? {};
  let geo: ShopProfileV1["shop"]["geo"] = null;
  if (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    const isExact =
      s.locationType === "STOREFRONT" && address?.geocodePrecision === "street";
    geo = isExact
      ? { ...roundLocation(latitude, longitude), precision: "exact" }
      : {
          ...offsetLocation(s.id, latitude, longitude),
          precision: "approximate",
        };
  }

  return {
    name: s.name.trim(),
    ownerName: s.ownerName.trim(),
    bio: plainOrNull(s.bio, ABOUT_MAX_CHARS),
    description: plainOrNull(s.description, ABOUT_MAX_CHARS),
    url: `${baseUrl}${shopPath(s)}`,
    website: normalizeWebsite(s.website),
    socialLinks: parseSocialLinks(s.socialLinks.join("\n")),
    logoUrl: shopImageUrl(s.logoPhoto, baseUrl),
    locationType: s.locationType,
    // A bare country (the shop form defaults it to "US") isn't a locality.
    locality: city || state ? { city, state, country } : null,
    streetAddress,
    geo,
    attributeTags: uniqueStrings(s.attributeTags),
    collaboration: toCollaboration(s, COLLAB_TEXT_MAX_CHARS),
  };
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

function buildOverlayProduct(
  p: ShopProfileSourceProduct,
): ShopProfileOverlayProduct {
  return {
    name: p.name.trim(),
    productUrl: blankToNull(p.productUrl),
    afCategories: uniqueStrings(p.categories),
    tags: uniqueStrings(
      p.tags,
      p.attributeTags,
      p.materialTags,
      p.environmentalTags,
    ),
  };
}

function buildFullProduct(
  p: ShopProfileSourceProduct,
  baseUrl: string,
): ShopProfileFullProduct {
  return {
    ...buildOverlayProduct(p),
    priceInCents: positiveCents(p.priceInCents),
    currency: currencyOf(p.currency),
    description: plainOrNull(p.description, DESCRIPTION_MAX_CHARS),
    imageUrl: absoluteUrl(
      addFullProductImageUrl({ imageUrl: p.imageUrl }).imageUrl,
      baseUrl,
    ),
    isFeatured: p.isFeatured,
  };
}

function buildService(
  sv: ShopProfileSourceService,
  baseUrl: string,
): ShopProfileService {
  return {
    name: sv.name.trim(),
    serviceUrl: blankToNull(sv.serviceUrl),
    priceInCents: positiveCents(sv.priceInCents),
    currency: currencyOf(sv.currency),
    durationInMinutes:
      sv.durationInMinutes !== null && sv.durationInMinutes > 0
        ? sv.durationInMinutes
        : null,
    description: plainOrNull(sv.description, DESCRIPTION_MAX_CHARS),
    imageUrl: absoluteUrl(
      addFullServiceImageUrl({ imageUrl: sv.imageUrl })?.imageUrl,
      baseUrl,
    ),
    afCategories: uniqueStrings(sv.categories),
    tags: uniqueStrings(sv.tags, sv.attributeTags),
  };
}

function buildCatalog(
  source: ShopProfileSource,
  publicProducts: ShopProfileSourceProduct[],
  productTotal: number,
  serviceTotal: number,
  baseUrl: string,
): ShopProfileCatalog {
  const s = source.shop;
  const catalogSource: ShopProfileCatalogSource =
    s.syncEnabled && s.syncPlatform ? s.syncPlatform : "MANUAL";
  const base = {
    syncedFrom: s.syncPlatform ? originOf(s.syncUrl ?? s.website) : null,
    productCount: productTotal,
    serviceCount: serviceTotal,
    lastSyncedAt: s.lastSyncedAt?.toISOString() ?? null,
  };

  // SimplePress owns price/description/photos for its catalog; AF overlays
  // only its categories and tags.
  if (catalogSource === "SIMPLEPRESS") {
    return {
      catalog: { mode: "overlay", source: catalogSource, ...base },
      products: publicProducts.map(buildOverlayProduct),
    };
  }
  return {
    catalog: { mode: "full", source: catalogSource, ...base },
    products: publicProducts.map((p) => buildFullProduct(p, baseUrl)),
  };
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export function buildShopProfile(
  source: ShopProfileSource,
  opts: { baseUrl: string; now: Date },
): ShopProfileV1 {
  const baseUrl = opts.baseUrl.replace(/\/+$/, "");

  const allProducts = source.products
    .filter((p) => p.isPublic)
    .sort(catalogOrder);
  const allServices = source.services
    .filter((sv) => sv.isPublic)
    .sort(catalogOrder);
  const productTotal = Math.max(source.productTotal ?? 0, allProducts.length);
  const serviceTotal = Math.max(source.serviceTotal ?? 0, allServices.length);
  const products = allProducts.slice(0, MAX_ITEMS);
  const services = allServices
    .slice(0, MAX_ITEMS)
    .map((sv) => buildService(sv, baseUrl));

  const { latitude, longitude } = source.shop.address ?? {};
  const { network, directoryTotal } = buildNetwork(
    {
      id: source.shop.id,
      // Real coordinates: distances are computed, never the subject's pin.
      geo:
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
          ? { lat: latitude, lng: longitude }
          : null,
    },
    source.networkShops,
    source.events,
    { baseUrl, now: opts.now },
  );

  return {
    schema: SHOP_PROFILE_SCHEMA,
    generatedAt: opts.now.toISOString(),
    truncated: productTotal > products.length || serviceTotal > services.length,
    shop: buildShop(source, baseUrl),
    ...buildCatalog(source, products, productTotal, serviceTotal, baseUrl),
    services,
    network,
    counts: {
      products: productTotal,
      services: serviceTotal,
      directory: directoryTotal,
      upcomingEvents: network.upcomingEvents.length,
    },
  };
}
