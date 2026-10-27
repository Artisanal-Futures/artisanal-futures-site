/**
 * `artisanalfutures.shop-profile/v1` — the wire contract served by
 * `GET /api/v1/shop-profile` and parsed by ProfitMax. Change this ONLY together
 * with the ProfitMax parser (a breaking change needs a v2 schema id).
 *
 * PUBLIC DATA ONLY. Deliberately excluded:
 *   - `ownerId` and every other DB id (the subject's and, above all, other
 *     shops'); other shops are identified by name + public AF URL only.
 *   - private contact (`ShopPrivateContact`, and the shop's phone/email).
 *   - admin SEO overrides (`seoTitle`, `seoDescription`, `seoImage`,
 *     `seoNoIndex`).
 *   - sync configuration (`syncUrl`, `allowInsecureOrigin`, `syncEnabled`);
 *     only the platform and the feed's origin are exposed.
 *   - the street address of any shop that isn't a STOREFRONT (and ZIP+4).
 *   - coordinates of other shops — the network groups carry a rounded
 *     distance only. The subject's own `geo` is the same public pin the
 *     Artisan Map shows (exact for a street-geocoded storefront, otherwise
 *     offset).
 *
 * Money is integer cents + an ISO currency code.
 */

export const SHOP_PROFILE_SCHEMA = "artisanalfutures.shop-profile/v1";

/** Products/services past this many are dropped and `truncated` is set. */
export const MAX_ITEMS = 500;

/** Plain-text caps (characters). */
export const ABOUT_MAX_CHARS = 2000;
export const DESCRIPTION_MAX_CHARS = 600;

/** Entries per network group. */
export const MAX_NETWORK_ITEMS = 10;

/** "Nearby" / "complementary" radius. */
export const NEARBY_RADIUS_MILES = 50;

/** AF categories listed per network shop. */
export const MAX_NETWORK_CATEGORIES = 5;

/** Same vocabulary as Prisma's `ProductScrapeMethod`. */
export type ShopProfileCatalogSource =
  | "MANUAL"
  | "WORDPRESS"
  | "SHOPIFY"
  | "SQUARESPACE"
  | "SIMPLEPRESS"
  | "SQUARE";

export type ShopProfileLocationType = "STOREFRONT" | "HOME_BASED" | "AREA";

/**
 * SimplePress is the source of truth for a SimplePress-synced catalog (price,
 * description, photos, stock), so AF only overlays what it adds: its category
 * mapping and tags.
 */
export type ShopProfileOverlayProduct = {
  name: string;
  productUrl: string | null;
  afCategories: string[];
  tags: string[];
};

export type ShopProfileFullProduct = {
  name: string;
  productUrl: string | null;
  priceInCents: number | null;
  currency: string;
  description: string | null;
  imageUrl: string | null;
  afCategories: string[];
  tags: string[];
  isFeatured: boolean;
};

export type ShopProfileService = {
  name: string;
  serviceUrl: string | null;
  priceInCents: number | null;
  currency: string;
  durationInMinutes: number | null;
  description: string | null;
  imageUrl: string | null;
  afCategories: string[];
  tags: string[];
};

export type NetworkShop = {
  name: string;
  /** Absolute AF profile URL. */
  url: string;
  /** "City, ST", either part alone, or null. */
  locality: string | null;
  /** Rounded to 0.1 mi; null when either side has no coordinates. */
  distanceMiles: number | null;
  attributeTags: string[];
  /** Their most-used AF categories (public products + services). */
  categories: string[];
  /** Human-readable "why this shop", e.g. "4.2 mi away". */
  reason: string;
};

export type NetworkEvent = {
  title: string;
  startsAt: string;
  endsAt: string | null;
  /** The event's call-to-action link, else the host shop's AF profile. */
  url: string;
  /** The event's own free-text location, as shown publicly on AF. */
  location: string | null;
  /** Host shop's "City, ST". */
  locality: string | null;
  distanceMiles: number | null;
  hostShop: string | null;
};

export type ShopProfileNetwork = {
  nearby: NetworkShop[];
  sharedValues: NetworkShop[];
  complementary: NetworkShop[];
  upcomingEvents: NetworkEvent[];
};

type CatalogBase = {
  source: ShopProfileCatalogSource;
  /** Origin of the synced storefront, or null for a manual catalog. */
  syncedFrom: string | null;
  /** Public products/services, before any cap. */
  productCount: number;
  serviceCount: number;
  lastSyncedAt: string | null;
};

/**
 * Branch on `catalog.mode`: "overlay" (SimplePress catalogs) carries the lean
 * product shape, "full" everything AF knows.
 */
export type ShopProfileCatalog =
  | {
      catalog: CatalogBase & { mode: "overlay"; source: "SIMPLEPRESS" };
      products: ShopProfileOverlayProduct[];
    }
  | {
      catalog: CatalogBase & { mode: "full" };
      products: ShopProfileFullProduct[];
    };

export type ShopProfileV1 = {
  schema: typeof SHOP_PROFILE_SCHEMA;
  generatedAt: string;
  /** Products or services were capped at `MAX_ITEMS`. */
  truncated: boolean;
  shop: {
    name: string;
    ownerName: string;
    bio: string | null;
    description: string | null;
    /** Absolute AF profile URL. */
    url: string;
    website: string | null;
    socialLinks: string[];
    logoUrl: string | null;
    locationType: ShopProfileLocationType;
    locality: {
      city: string | null;
      state: string | null;
      country: string | null;
    } | null;
    /** STOREFRONT only. */
    streetAddress: string | null;
    geo: {
      lat: number;
      lng: number;
      precision: "exact" | "approximate";
    } | null;
    attributeTags: string[];
  };
  services: ShopProfileService[];
  network: ShopProfileNetwork;
  counts: {
    products: number;
    services: number;
    nearby: number;
    sharedValues: number;
    complementary: number;
    upcomingEvents: number;
  };
} & ShopProfileCatalog;
