import { SITE_URL } from "~/lib/seo/site-url";
import { verifyShopApiToken } from "~/server/lib/api-tokens";
import { checkRateLimit } from "~/server/lib/rate-limit";
import { buildShopProfile } from "~/server/shop-profile/build";
import { loadShopProfileSource } from "~/server/shop-profile/load";

/**
 * `GET /api/v1/shop-profile` — one shop's public profile + catalog, plus AF
 * network recommendations (`artisanalfutures.shop-profile/v1`), for apps the
 * artisan connected with an API token (ProfitMax). Server-to-server only: no
 * CORS headers.
 *
 * Auth: `Authorization: Bearer <token>`; the token alone identifies the shop.
 * Every identity failure is the same bare 401 (never a 404, never a hint);
 * 403 only for a valid token without `profile:read`. Wire contract:
 * `src/server/shop-profile/types.ts`.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

/** Per token, not per IP: callers are servers that may share egress. */
const RATE_LIMIT = { limit: 30, windowMs: 60_000 };

const unauthorized = () =>
  Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });

export async function GET(request: Request) {
  try {
    const auth = await verifyShopApiToken({
      authorization: request.headers.get("authorization"),
      scope: "profile:read",
    });
    if (!auth.ok) {
      return auth.status === 403
        ? Response.json(
            { error: "insufficient_scope" },
            { status: 403, headers: NO_STORE },
          )
        : unauthorized();
    }

    if (!checkRateLimit(`api-token:${auth.tokenId}`, RATE_LIMIT)) {
      return Response.json(
        { error: "rate_limited" },
        { status: 429, headers: { ...NO_STORE, "Retry-After": "60" } },
      );
    }

    const now = new Date();
    const source = await loadShopProfileSource(auth.shopId, now);
    // The shop was hidden or deleted between the token check and this read.
    if (!source) return unauthorized();

    const profile = buildShopProfile(source, { baseUrl: SITE_URL, now });
    return Response.json(profile, { status: 200, headers: NO_STORE });
  } catch (error) {
    // Never leak details to the caller; the stack stays in the server log.
    console.error("[shop-profile] request failed", error);
    return Response.json(
      { error: "internal_error" },
      { status: 500, headers: NO_STORE },
    );
  }
}
