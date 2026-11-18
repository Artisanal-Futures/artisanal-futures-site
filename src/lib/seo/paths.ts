/**
 * Single place public shop URLs are built. Shops get a slug URL
 * (/shops/kente-collective); until a shop has one (pre-backfill) the id still
 * resolves, and the page redirects it to the slug once it exists.
 * Client-safe: no server-only imports.
 *
 * Admin routes (/admin/shops/{id}) stay id-based and don't go through here.
 */
export function shopPath(shop: { id: string; slug?: string | null }) {
  return `/shops/${shop.slug ?? shop.id}`;
}

/** Artisan map URL, optionally pre-filtered. Empty params are omitted. */
export function artisanMapPath(
  params: {
    q?: string | null;
    category?: string | null;
    shop?: string | null;
  } = {},
) {
  const query = (["q", "category", "shop"] as const)
    .flatMap((key) => {
      const value = params[key]?.trim();
      return value ? [`${key}=${encodeURIComponent(value)}`] : [];
    })
    .join("&");
  return query ? `/tools/artisan-map?${query}` : "/tools/artisan-map";
}
