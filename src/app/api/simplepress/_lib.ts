/**
 * Shared, framework-free pieces of the `/api/simplepress` route.
 *
 * Next.js route modules may only export route handlers (`GET`, `POST`, ...) and
 * route-segment config, so the zod schema and the authorization decision live
 * here where they can be unit-tested directly (see
 * `scripts/test-simplepress-route.ts`). This module imports NO env — secrets are
 * passed in as parameters, so tests can exercise `authorizeRequest` with
 * synthetic values without triggering env validation.
 */
import { z } from "zod";

import {
  timingSafeCompare,
  verifyPartnerRequest,
} from "~/server/lib/partner-auth";

/**
 * Inbound SP → AF callback body, per the "Shared contract" in
 * `docs/integrations/simplepress-provisioning.md`. Replaces the old v1 shape
 * `{code, status, subdomain, customDomain}` (which rejected every real SP
 * callback). `customDomain`/`errorMessage` are optional + nullable; the
 * storefront URL travels in `deploymentUrl`, never in `customDomain`.
 */
export const postBodySchema = z.object({
  code: z.string().min(1),
  event: z.enum(["claimed", "failed"]),
  status: z.enum(["ACTIVE", "FAILED"]),
  subdomain: z.string().min(1),
  deploymentUrl: z.string().url(),
  customDomain: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
});

export type SimplePressCallbackBody = z.infer<typeof postBodySchema>;

export type AuthorizeSecrets = {
  /** Expected bearer on SP → AF calls (env.SIMPLEPRESS_CALLBACK_TOKEN). */
  callbackToken: string;
  /** Shared HMAC key (env.AF_SP_WEBHOOK_SECRET). */
  hmacSecret: string;
  /** DEPRECATED cutover bearer (env.SIMPLEPRESS_HASH_SECRET). */
  legacyBearer: string;
};

/**
 * Decide whether an inbound SimplePress request is authorized. Pure: takes the
 * secrets explicitly so it can be tested without env.
 *
 * Order of checks:
 *   1. PRIMARY — full partner verification: bearer `callbackToken` + timestamp
 *      within ±300s + HMAC signature over `rawBody`. Passing this is the target
 *      steady state once SP ships the signed headers everywhere.
 *   2. CUTOVER FALLBACK (TEMPORARY — remove at cutover, see docs A6 build
 *      step 7): if the primary check fails AND the request carries NO
 *      `X-Partner-Signature` header at all, accept a bearer that timing-safe-
 *      equals `legacyBearer`. This replaces the old timing-UNSAFE `!==` compare.
 *
 * Crucially, if an `X-Partner-Signature` header IS present the request is
 * claiming to be a signed partner call, so the full primary verification MUST
 * pass — we never downgrade a signed-but-invalid request to the weaker static-
 * bearer path. `rawBody` for GET is the canonical query string `code=<value>`;
 * for POST it is the raw request body bytes.
 */
export function authorizeRequest(
  req: Request,
  rawBody: string,
  secrets: AuthorizeSecrets,
): boolean {
  const primary = verifyPartnerRequest(req, {
    bearer: secrets.callbackToken,
    hmacSecret: secrets.hmacSecret,
    rawBody,
  });
  if (primary.ok) return true;

  // A signature header present means "I am a signed request" — no downgrade.
  if (req.headers.get("x-partner-signature")) return false;

  const authHeader = req.headers.get("authorization") ?? "";
  return timingSafeCompare(authHeader, `Bearer ${secrets.legacyBearer}`);
}
