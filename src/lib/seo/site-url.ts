import { env } from "~/env";

// Reads process.env rather than env.NODE_ENV: NODE_ENV is server-only in
// src/env.js, but this module is also imported by client components, and Next
// inlines process.env.NODE_ENV on both sides.
const FALLBACK_SITE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://artisanalfutures.org";

/**
 * Canonical origin of this deployment, without a trailing slash. Client-safe
 * (only reads a NEXT_PUBLIC_ var), so share buttons can use it too. Falls back
 * to localhost in development and the production domain otherwise.
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
