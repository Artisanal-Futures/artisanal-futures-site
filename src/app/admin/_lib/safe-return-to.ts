/**
 * Validates a `returnTo` query value so it can't be used as an open redirect.
 * Only same-origin paths under `/admin/` are accepted; anything else yields
 * `null` and callers fall back to their default destination.
 */
export function safeAdminReturnTo(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/admin/") || value.startsWith("//")) return null;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return null;

  try {
    const url = new URL(value, "http://x");
    if (url.origin !== "http://x" || !url.pathname.startsWith("/admin/")) {
      return null;
    }
    return url.pathname + url.search;
  } catch {
    return null;
  }
}
