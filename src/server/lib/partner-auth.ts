import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Machine-to-machine partner authentication shared by the SimplePress (SP)
 * integration in both directions. The scheme is defined in
 * `docs/integrations/simplepress-provisioning.md` ("Shared contract") and must
 * stay byte-for-byte compatible with the SimplePress repo's `partner-auth`
 * (`src/lib/partner-auth.ts` there — this module is its behavioural mirror).
 *
 * Every partner request carries three headers:
 *
 *   Authorization:       Bearer <direction token>
 *   X-Partner-Timestamp: <unix seconds>
 *   X-Partner-Signature: v1=<hex hmac-sha256(AF_SP_WEBHOOK_SECRET, `${timestamp}.${rawBody}`)>
 *
 * The bearer differs per direction (SIMPLEPRESS_API_TOKEN outbound AF->SP,
 * SIMPLEPRESS_CALLBACK_TOKEN expected inbound SP->AF); the HMAC key
 * (AF_SP_WEBHOOK_SECRET) is shared in both directions. The signature is computed
 * over the RAW request body bytes, never a re-serialized object. For GET
 * requests the caller passes the canonical query string (e.g. `code=XXX`) as
 * `rawBody`.
 *
 * NOTE: unlike the SimplePress copy this module intentionally does NOT `import
 * "server-only"` — the AF convention in `src/server/lib/` (see `safe-fetch.ts`)
 * does not use that guard, and dropping it also lets the shared-vector test
 * script (`scripts/test-partner-auth.ts`) import the module under plain tsx.
 * Secrets are always passed in as parameters; this module imports no env.
 */

const SKEW_SECONDS = 300;

/**
 * Timing-safe string comparison. SHA-256 both inputs to fixed-width digests
 * first, so `crypto.timingSafeEqual` never throws on differing lengths and no
 * byte-level or length-based timing signal leaks. Models the SHA-256-then-
 * `timingSafeEqual` pattern used for the cron bearer check in the SP repo.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

/**
 * Compute the partner signature over `${timestamp}.${rawBody}`.
 *
 * @param rawBody   The exact serialized request body string (or, for GET, the
 *                  canonical query string). HMAC runs over these raw bytes.
 * @param secret    The shared HMAC key (AF_SP_WEBHOOK_SECRET).
 * @param timestamp Optional unix-seconds timestamp. Defaults to now. Exposed
 *                  purely for deterministic testing — do not pass a fixed value
 *                  in production code.
 * @returns The `timestamp` used and the `v1=<hex>` formatted signature.
 */
export function signPartnerRequest(
  rawBody: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000),
): { timestamp: number; signature: string } {
  const hex = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return { timestamp, signature: `v1=${hex}` };
}

export type PartnerVerifyResult =
  | { ok: true }
  | { ok: false; reason: "bearer" | "timestamp" | "signature" | "malformed" };

/**
 * Verify an inbound partner request. Checks, in order:
 *   1. `Authorization: Bearer <bearer>` is present and matches (timing-safe).
 *   2. `X-Partner-Timestamp` parses and is within ±300s (inclusive) of now.
 *   3. `X-Partner-Signature` matches the recomputed HMAC (timing-safe).
 *
 * All comparisons run through `timingSafeCompare`, so a mismatch never reveals
 * which byte differed. The ordering only distinguishes failure classes for the
 * caller's diagnostics; it does not create a byte-level timing oracle.
 *
 * @param opts.rawBody For GET requests, pass the canonical query string (e.g.
 *                     `code=XXX`); the signature is computed over the raw
 *                     request body bytes, so the caller must read the body text
 *                     BEFORE any JSON parsing and hand it in here unchanged.
 */
export function verifyPartnerRequest(
  req: Request,
  opts: {
    bearer: string;
    hmacSecret: string;
    rawBody: string;
    nowSeconds?: number;
  },
): PartnerVerifyResult {
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);

  // 1. Bearer.
  const authHeader = req.headers.get("authorization") ?? "";
  if (!timingSafeCompare(authHeader, `Bearer ${opts.bearer}`)) {
    return { ok: false, reason: "bearer" };
  }

  // 2. Timestamp within the replay window.
  const tsHeader = req.headers.get("x-partner-timestamp");
  if (!tsHeader) return { ok: false, reason: "timestamp" };
  const ts = Number(tsHeader);
  if (!Number.isInteger(ts)) return { ok: false, reason: "timestamp" };
  if (Math.abs(now - ts) > SKEW_SECONDS) {
    return { ok: false, reason: "timestamp" };
  }

  // 3. Signature. A missing or non-`v1=` header is malformed; a well-formed
  //    header that doesn't match the recomputed HMAC is a signature failure.
  const sigHeader = req.headers.get("x-partner-signature");
  if (!sigHeader?.startsWith("v1=")) {
    return { ok: false, reason: "malformed" };
  }
  const expected = signPartnerRequest(opts.rawBody, opts.hmacSecret, ts);
  if (!timingSafeCompare(sigHeader, expected.signature)) {
    return { ok: false, reason: "signature" };
  }

  return { ok: true };
}
