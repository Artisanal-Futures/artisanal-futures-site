import { timingSafeCompare } from "~/server/lib/partner-auth";

/**
 * Request-authorization logic for the weekly product-sync cron, kept out of
 * `route.ts` so it can be exercised without Next's request plumbing and without
 * importing `~/env` (the secret is passed in). Mirrors the split used by
 * `src/app/api/simplepress/{route,_lib}.ts`.
 *
 * The sweep itself lives in `~/server/lib/product-sync` (`runScheduledSync`),
 * because the admin "Sync all shops now" button runs the very same code — a
 * route handler is the wrong home for logic two callers share.
 */

/**
 * Constant-time bearer check. Returns false for a missing or malformed header
 * rather than throwing, so the caller can answer a flat 401 without revealing
 * which part failed.
 */
export function authorizeCronRequest(
  authHeader: string | null,
  secret: string,
): boolean {
  if (!authHeader || !secret) return false;
  return timingSafeCompare(authHeader, `Bearer ${secret}`);
}
