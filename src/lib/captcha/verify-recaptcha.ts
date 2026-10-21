import "server-only";

import { env } from "~/env";

// NOTE: deliberately no `"use server"` directive. That directive publishes
// every export as a callable Server Action reachable from the browser; this
// verifier is only ever called server-to-server.

const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/** Without a timeout a hung Google connection would hold the request open. */
const VERIFY_TIMEOUT_MS = 10_000;

export type RecaptchaFailureReason =
  | "missing-token"
  | "provider-error"
  | "failed"
  | "low-score"
  | "bad-action";

export type RecaptchaResult =
  | { ok: true; hostname: string; score: number }
  | { ok: false; reason: RecaptchaFailureReason };

/** Shape of the siteverify JSON we actually read. All fields are optional
 *  because a malformed/error response still returns 200 with a partial body. */
type SiteverifyResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

/**
 * Verify a reCAPTCHA v3 token.
 *
 * Skipped (returns ok) in development or when no secret is configured.
 * Otherwise fails closed: `provider-error` means we could not reach a verdict
 * (network failure, timeout, misconfigured secret).
 *
 * @param token       the token minted by the client hook
 * @param opts.action the action this call site expects (`contact`, …) — one
 *                    key serves every form, so this stops a token minted on
 *                    one form from replaying against another
 * @param opts.remoteIp best-effort client IP, forwarded to Google as `remoteip`
 */
export async function verifyRecaptcha(
  token: string,
  opts: { action: string; remoteIp?: string },
): Promise<RecaptchaResult> {
  const secret = env.RECAPTCHA_SECRET_KEY;

  if (!secret || process.env.NODE_ENV === "development") {
    console.warn("RECAPTCHA_SECRET_KEY not configured - skipping verification");
    return { ok: true, hostname: "", score: 1 }; // Allow in development
  }

  if (!token || token.trim() === "") {
    return { ok: false, reason: "missing-token" };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (opts.remoteIp) {
    body.set("remoteip", opts.remoteIp);
  }

  let data: SiteverifyResponse;
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`reCAPTCHA siteverify returned HTTP ${response.status}`);
      return { ok: false, reason: "provider-error" };
    }

    data = (await response.json()) as SiteverifyResponse;
  } catch (error) {
    // Network failure, DNS failure, or the AbortSignal firing, plus any
    // non-JSON body from `response.json()`.
    console.error("reCAPTCHA verification error:", error);
    return { ok: false, reason: "provider-error" };
  }

  if (data.success !== true) {
    // Google returns HTTP 200 with success:false for both ordinary token
    // failures AND configuration errors (invalid-input-secret, etc.).
    const errorCodes = data["error-codes"] ?? [];
    const isConfigError = errorCodes.some((code) =>
      [
        "invalid-input-secret",
        "invalid-keys",
        "bad-request",
        "browser-error",
      ].includes(code),
    );
    if (isConfigError) {
      console.error(
        `reCAPTCHA siteverify config error-codes: ${errorCodes.join(",")}`,
      );
      return { ok: false, reason: "provider-error" };
    }
    return { ok: false, reason: "failed" };
  }

  // v3 always returns a score. Its absence means we are not talking to a v3
  // key (or not to Google at all), which is not something to trust.
  if (typeof data.score !== "number" || data.score < env.RECAPTCHA_MIN_SCORE) {
    return { ok: false, reason: "low-score" };
  }

  if (data.action !== opts.action) {
    return { ok: false, reason: "bad-action" };
  }

  return { ok: true, hostname: data.hostname ?? "", score: data.score };
}
