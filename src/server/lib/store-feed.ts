import { SafeFetchError, safeFetchText } from "~/server/lib/safe-fetch";

/**
 * Fetches a shop's public product feed from its own storefront.
 *
 * Shopify (`/products.json`) and WordPress (`/wp-json/wp/v2/product`) have a
 * fixed feed path we can derive from the shop's domain. Squarespace has no
 * site-wide feed — instead any page returns its data as JSON when you append
 * `?format=json`. So Squarespace only works if the stored URL is the *page
 * that lists products* (e.g. business.com/store), not just the homepage.
 *
 * This module is deliberately free of tRPC and env imports so it can be called
 * from a request (the migration wizard) and from the scheduled product sync
 * alike, and so its pure helpers stay testable.
 *
 * The returned `json` is shaped exactly like a manual export from that platform
 * so the shared `mapProducts` parser handles both paths unchanged.
 */

export type FetchablePlatform =
  | "shopify"
  | "wordpress"
  | "squarespace"
  | "simplepress";

export const FETCHABLE_PLATFORMS: FetchablePlatform[] = [
  "shopify",
  "wordpress",
  "squarespace",
  "simplepress",
];

export type StoreFeedResult = {
  /** Raw JSON string shaped like that platform's manual export. */
  json: string;
  count: number;
  /**
   * Set when a request had to skip TLS verification because the store's
   * certificate is invalid/expired. Surfaced so the artisan can be told to
   * renew it.
   */
  insecureTLSCode: string | null;
};

/** Thrown when the store responded but not with a usable product list. */
export class StoreFeedFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreFeedFormatError";
  }
}

// --- WordPress featured-media resolution ------------------------------------
// WordPress exposes a product's image on a *separate* media endpoint, not on
// the product object. We resolve it here on the server (no CORS, and one
// request per page when `_embed` is honored) and inject a flat
// `featured_image_url` field that the shared import parser reads directly.
type WpMedia = { source_url?: string; guid?: { rendered?: string } };
export type WpFetchedProduct = {
  featured_media?: number;
  _embedded?: { "wp:featuredmedia"?: WpMedia[] };
  _links?: { "wp:featuredmedia"?: Array<{ href?: string }> };
  [key: string]: unknown;
};

function imageFromEmbedded(product: WpFetchedProduct): string | null {
  const media = product._embedded?.["wp:featuredmedia"]?.[0];
  return media?.source_url ?? media?.guid?.rendered ?? null;
}

/**
 * Resolve each WordPress product's featured image into a flat
 * `featured_image_url`. Prefers the `_embedded` media that `_embed` returns
 * inline; for installs that ignore `_embed`, falls back to fetching the
 * product's media href server-side, with bounded concurrency and a hard cap so
 * a no-embed store can't trigger thousands of outbound requests.
 */
export async function resolveWordPressImages(
  products: WpFetchedProduct[],
  onInsecureTLSFallback?: (certCode: string) => void,
): Promise<Array<WpFetchedProduct & { featured_image_url: string | null }>> {
  const MAX_HREF_FETCHES = 100;
  const CONCURRENCY = 6;
  let hrefFetches = 0;
  let cursor = 0;
  const results = new Array<
    WpFetchedProduct & { featured_image_url: string | null }
  >(products.length);

  async function worker() {
    while (cursor < products.length) {
      const i = cursor++;
      const product = products[i]!;
      let imageUrl = imageFromEmbedded(product);
      if (!imageUrl) {
        const href = product._links?.["wp:featuredmedia"]?.[0]?.href;
        const hasMedia =
          typeof product.featured_media === "number" &&
          product.featured_media > 0;
        if (href && hasMedia && hrefFetches < MAX_HREF_FETCHES) {
          hrefFetches++;
          try {
            const media = JSON.parse(
              await safeFetchText(href, {
                allowInsecureTLSFallback: true,
                onInsecureTLSFallback,
              }),
            ) as WpMedia;
            imageUrl = media.source_url ?? media.guid?.rendered ?? null;
          } catch (err) {
            console.error(
              `[store-feed] Failed to resolve WP media ${href}:`,
              err,
            );
          }
        }
      }
      results[i] = { ...product, featured_image_url: imageUrl };
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, products.length) }, worker),
  );
  return results;
}

// --- URL normalization ------------------------------------------------------

/** Thrown when the stored website can't be parsed into a usable URL. */
export class StoreUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreUrlError";
  }
}

/**
 * Turn a shop's stored website into a URL we can fetch from.
 *
 * Defaults to forcing `https:` — most artisan sites that omit the scheme do
 * serve HTTPS, and upgrading avoids silently fetching over plaintext. Shops
 * explicitly flagged with `allowInsecureOrigin` keep whatever scheme they
 * stored (and default to `http:` when none was given), which is the escape
 * hatch for the one shop that hasn't got a certificate yet. Every other
 * `safe-fetch` protection — private/reserved IP blocking, no redirects, size
 * and time caps — still applies either way.
 */
export function normalizeStoreUrl(
  website: string,
  allowInsecureOrigin = false,
): URL {
  const trimmed = website.trim();
  if (!trimmed) {
    throw new StoreUrlError("No store URL was provided.");
  }
  const hasScheme = /^https?:\/\//i.test(trimmed);
  const withScheme = hasScheme
    ? trimmed
    : `${allowInsecureOrigin ? "http" : "https"}://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new StoreUrlError(`The store website "${website}" is not a valid URL.`);
  }
  if (!allowInsecureOrigin) {
    url.protocol = "https:";
  }
  return url;
}

// --- Per-platform feed fetching ---------------------------------------------

export type FetchStoreFeedOptions = {
  /** The shop's stored website (or sync URL override). */
  website: string;
  platform: FetchablePlatform;
  /**
   * Permit a plain-HTTP origin instead of forcing https. Opt-in per shop for
   * storefronts without a working certificate.
   */
  allowInsecureOrigin?: boolean;
};

export async function fetchStoreFeed({
  website,
  platform,
  allowInsecureOrigin = false,
}: FetchStoreFeedOptions): Promise<StoreFeedResult> {
  // `origin` (no path/query) is used by Shopify/WordPress/SimplePress;
  // `storeUrl` keeps the full path for Squarespace, whose feed lives at the
  // products page itself.
  const storeUrl = normalizeStoreUrl(website, allowInsecureOrigin);
  const origin = storeUrl.origin;

  let insecureTLSCode: string | null = null;
  const onInsecureTLSFallback = (certCode: string) => {
    insecureTLSCode ??= certCode;
  };

  if (platform === "shopify") {
    // Shopify exposes /products.json with page-based pagination.
    const MAX_PAGES = 40; // 40 * 250 = up to 10k products
    const products: unknown[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const text = await safeFetchText(
        `${origin}/products.json?limit=250&page=${page}`,
        { allowInsecureTLSFallback: true, onInsecureTLSFallback },
      );
      const parsed = JSON.parse(text) as { products?: unknown[] };
      const batch = parsed.products ?? [];
      products.push(...batch);
      if (batch.length < 250) break;
    }
    return {
      json: JSON.stringify({ products }),
      count: products.length,
      insecureTLSCode,
    };
  }

  if (platform === "simplepress") {
    // SimplePress exposes a single flat product feed at /api/products (no
    // pagination). The response is { business, products }; we hand back just
    // `{ products }` to match the shared parser.
    const text = await safeFetchText(`${origin}/api/products`, {
      allowInsecureTLSFallback: true,
      onInsecureTLSFallback,
    });
    const parsed = JSON.parse(text) as { products?: unknown[] };
    const products = Array.isArray(parsed.products) ? parsed.products : [];
    console.log(
      `[store-feed] SimplePress feed (${origin}) collected ${products.length} products.`,
    );
    return {
      json: JSON.stringify({ products }),
      count: products.length,
      insecureTLSCode,
    };
  }

  if (platform === "squarespace") {
    // Squarespace renders any page as JSON when you append `?format=json`.
    // There's no site-wide product feed, so we fetch the exact page saved as
    // the store URL (path preserved) and paginate via the `pagination` offset
    // the response hands back.
    type SquarespaceFeed = {
      items?: unknown[];
      pagination?: { nextPage?: boolean; nextPageOffset?: number };
    };
    const MAX_PAGES = 30; // ~20 items/page -> up to ~600 products
    const items: unknown[] = [];
    let offset: number | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const pageUrl = new URL(storeUrl.href);
      pageUrl.searchParams.set("format", "json");
      if (offset !== undefined) {
        pageUrl.searchParams.set("offset", String(offset));
      }
      const text = await safeFetchText(pageUrl.href, {
        allowInsecureTLSFallback: true,
        onInsecureTLSFallback,
      });
      const feed = JSON.parse(text) as SquarespaceFeed;
      const batch = Array.isArray(feed.items) ? feed.items : [];
      items.push(...batch);
      if (
        batch.length === 0 ||
        !feed.pagination?.nextPage ||
        typeof feed.pagination.nextPageOffset !== "number"
      ) {
        break;
      }
      offset = feed.pagination.nextPageOffset;
    }
    console.log(
      `[store-feed] Squarespace feed (${storeUrl.href}) collected ${items.length} products.`,
    );
    return {
      json: JSON.stringify({ items }),
      count: items.length,
      insecureTLSCode,
    };
  }

  // WordPress REST API: /wp-json/wp/v2/product with per_page/page.
  // `_embed=wp:featuredmedia` asks WP to inline each product's featured image
  // so we don't have to make a separate request per product.
  const MAX_PAGES = 50; // 50 * 100 = up to 5k products
  const products: WpFetchedProduct[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const fetchUrl = `${origin}/wp-json/wp/v2/product?per_page=100&page=${page}&_embed=wp:featuredmedia`;
    console.log(`[store-feed] WordPress fetch URL: ${fetchUrl}`);
    let text: string;
    try {
      text = await safeFetchText(fetchUrl, {
        allowInsecureTLSFallback: true,
        onInsecureTLSFallback,
      });
    } catch (err) {
      // WP returns a 400 once you page past the end; stop gracefully if we've
      // already collected something, otherwise surface the error.
      if (page > 1 && err instanceof SafeFetchError) break;
      console.error(
        `[store-feed] WordPress fetch failed (${fetchUrl}):`,
        err,
      );
      throw err;
    }
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) {
      // A 200 that isn't an array is almost always a WP error object
      // ({"code":"rest_no_route",...}) or an unexpected payload shape.
      console.error(
        `[store-feed] WordPress returned a non-array payload (${fetchUrl}): ${text.slice(
          0,
          500,
        )}`,
      );
      throw new StoreFeedFormatError(
        "The store didn't return a product list. This site may not expose products at /wp-json/wp/v2/product — try the manual paste flow.",
      );
    }
    const batch = parsed as WpFetchedProduct[];
    if (batch.length === 0) break;
    products.push(...batch);
    if (batch.length < 100) break;
  }
  const withImages = await resolveWordPressImages(
    products,
    onInsecureTLSFallback,
  );
  const resolvedCount = withImages.filter((p) => p.featured_image_url).length;
  console.log(
    `[store-feed] WordPress feed (${origin}) collected ${withImages.length} products (${resolvedCount} with images).`,
  );
  return {
    json: JSON.stringify(withImages),
    count: withImages.length,
    insecureTLSCode,
  };
}
