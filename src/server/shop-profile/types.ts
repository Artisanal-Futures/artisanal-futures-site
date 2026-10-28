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
 *   - coordinates of other shops — directory and event entries carry a
 *     rounded distance only. The subject's own `geo` is the same public pin the
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

/** Upcoming events listed in the network block. */
export const MAX_NETWORK_EVENTS = 10;

/** Directory entries past this many are dropped and `directoryTruncated` set. */
export const DIRECTORY_MAX = 300;

/** Per directory entry. */
export const DIRECTORY_ABOUT_MAX_CHARS = 300;
export const DIRECTORY_MAX_CATEGORIES = 5;
export const DIRECTORY_MAX_SERVICES = 8;

/** Collaboration text caps: the subject shop's own, and directory entries'. */
export const COLLAB_TEXT_MAX_CHARS = 500;
export const DIRECTORY_COLLAB_TEXT_MAX_CHARS = 300;

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

/**
 * A shop's opt-in, public mutual-aid listing ("We can offer" / "We're looking
 * for"). Tags are AF's `COLLABORATION_TAGS` labels; text is plain.
 */
export type ShopCollaboration = {
  /** ≤ 500 chars for the subject shop, ≤ 300 in directory entries. */
  offers: string | null;
  offerTags: string[];
  needs: string | null;
  needTags: string[];
};

/** Another AF member shop. Name + public URL only: no ids, no coordinates. */
export type DirectoryShop = {
  name: string;
  /** Absolute AF profile URL. */
  url: string;
  /** "City, ST", either part alone, or null. */
  locality: string | null;
  locationType: ShopProfileLocationType;
  /** From the subject, rounded to 0.1 mi; null when either side has no coordinates. */
  distanceMiles: number | null;
  /** Plain-text bio (else description), ≤ 300 chars. */
  about: string | null;
  /** Their most-used AF categories (public products + services), ≤ 5. */
  categories: string[];
  attributeTags: string[];
  /** Names of their public services, ≤ 8. */
  services: string[];
  /** Public products. */
  productCount: number;
  collaboration: ShopCollaboration;
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

/**
 * The whole AF member directory (every other public, indexable shop) rather
 * than pre-ranked picks: the consumer recommends only when a question calls
 * for it. Shops with a collaboration listing come first, then by distance
 * (unknown last), then name.
 */
export type ShopProfileNetwork = {
  directory: DirectoryShop[];
  /** The directory was capped at `DIRECTORY_MAX` (see `counts.directory`). */
  directoryTruncated: boolean;
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
    collaboration: ShopCollaboration;
  };
  services: ShopProfileService[];
  network: ShopProfileNetwork;
  counts: {
    products: number;
    services: number;
    /** Directory shops before the `DIRECTORY_MAX` cap. */
    directory: number;
    upcomingEvents: number;
  };
} & ShopProfileCatalog;
