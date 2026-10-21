import { env } from "~/env";

/** Base URL of the UPCY generator app. */
export const UPCY_BASE_URL = env.NEXT_PUBLIC_UPCY_URL.replace(/\/+$/, "");

/** UPCY's own admin console. */
export const UPCY_ADMIN_URL = `${UPCY_BASE_URL}/admin`;

/** Cookie remembering the UPCY URL a member should return to after joining. */
export const UPCY_RETURN_COOKIE = "af_upcy_return_to";

/**
 * Allowlist check for return-to URLs: exact origin match against UPCY_BASE_URL
 * (scheme + host + port), so the return cookie can't be abused as an open
 * redirect; also works for http://localhost:3001 in dev. Edge-safe.
 */
export function isUpcyUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    return new URL(value).origin === new URL(UPCY_BASE_URL).origin;
  } catch {
    return false;
  }
}

/** Full-page navigation for absolute URLs (e.g. back to UPCY), router push otherwise. */
export function navigateTo(
  url: string,
  router: { push: (path: string) => unknown },
) {
  if (url.startsWith("http")) window.location.assign(url);
  else router.push(url);
}
