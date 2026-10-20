import { env } from "~/env";

const FALLBACK_SITE_URL = "https://artisanalfutures.org";

/**
 * Canonical origin of this deployment, without a trailing slash. Client-safe
 * (only reads a NEXT_PUBLIC_ var), so share buttons can use it too.
 */
export const SITE_URL = (env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL).replace(
  /\/+$/,
  "",
);

/** Turn a site-relative path into an absolute URL. Absolute URLs pass through. */
export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
