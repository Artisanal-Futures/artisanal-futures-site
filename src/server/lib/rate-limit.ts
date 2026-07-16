/**
 * Tiny in-memory fixed-window rate limiter.
 *
 * DEPLOYMENT ASSUMPTION: Artisanal Futures has no Redis and runs as a SINGLE
 * Coolify instance, so a process-local `Map` is an acceptable store — there is
 * exactly one process holding the window counters, so the limit is enforced
 * globally. If AF is ever scaled horizontally this MUST move to a shared store
 * (e.g. Redis): a per-replica in-memory counter would multiply the effective
 * limit by the number of replicas and each replica would rate-limit in
 * isolation.
 *
 * The window is "fixed": each key gets a counter that resets at a fixed wall
 * point (`resetAt`), rather than a sliding window. This is intentionally the
 * simplest correct thing for abuse mitigation on a machine-to-machine webhook.
 */

type FixedWindow = { count: number; resetAt: number };

const DEFAULT_LIMIT = 30;
const DEFAULT_WINDOW_MS = 60_000;

/** How often (at most) we sweep the whole Map for expired windows. */
const PRUNE_INTERVAL_MS = 60_000;

// Module-level state. One Map for the whole process (see assumption above).
const windows = new Map<string, FixedWindow>();
let lastPruneAt = 0;

/**
 * Delete every window whose reset point has already passed. Called inline, at
 * most once per `PRUNE_INTERVAL_MS`, so the Map cannot grow unbounded from a
 * churn of one-off keys (e.g. spoofed X-Forwarded-For values) without the
 * per-request cost of walking it every time.
 */
function pruneExpired(now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
  lastPruneAt = now;
}

/**
 * Fixed-window rate limit check. Returns `true` if the request is allowed and
 * counts it against the window, `false` if the window's limit is exhausted.
 *
 * @param key       Bucket key — typically the client IP (see `getClientIp`).
 * @param opts.limit    Max requests per window. Default 30.
 * @param opts.windowMs Window length in ms. Default 60_000 (one minute).
 */
export function checkRateLimit(
  key: string,
  opts?: { limit?: number; windowMs?: number },
): boolean {
  const limit = opts?.limit ?? DEFAULT_LIMIT;
  const windowMs = opts?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();

  // Periodic inline pruning so expired windows can't accumulate forever.
  if (now - lastPruneAt >= PRUNE_INTERVAL_MS) pruneExpired(now);

  const existing = windows.get(key);

  // No live window, or the previous one has expired → start a fresh window.
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;

  existing.count += 1;
  return true;
}

/**
 * Best-effort client IP from request headers: the first entry of
 * `X-Forwarded-For`, falling back to `"unknown"` so rate limiting still applies
 * (all un-attributable callers share the `"unknown"` bucket) when no proxy
 * header is present. The repo has no pre-existing IP helper on this side, so
 * this mirrors the first-value convention used by the SimplePress reference
 * repo's `getClientIp`.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded !== undefined && forwarded !== "" ? forwarded : "unknown";
}
