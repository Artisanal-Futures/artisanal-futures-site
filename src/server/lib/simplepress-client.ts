import { z } from "zod";

import { env } from "~/env";
import { signPartnerRequest } from "~/server/lib/partner-auth";

/**
 * Outbound AF → SP client for `POST /api/partner/provision` (item A4). Spec:
 * `docs/integrations/simplepress-provisioning.md` ("Shared contract" +
 * "AF → SP"). Response shape mirrors the SimplePress repo's own
 * `SuccessResponse` type in `src/app/api/partner/provision/route.ts` and its
 * request schema in `src/lib/partner-provision.ts` (read there, not
 * imported — the repos are independent deployables).
 *
 * NOTE: no in-request retries. SimplePress is idempotent on
 * `afProvisionCode` (matching payload replays the existing business), so the
 * caller (the `requestMySite` mutation / the UI's "Try again") is free to
 * re-invoke this on failure without risking a duplicate site.
 */

const TIMEOUT_MS = 25_000;

export type ProvisionSiteInput = {
  afProvisionCode: string;
  businessName: string;
  email: string;
  phone?: string;
  logoUrl?: string;
  templateId?: string;
};

export type ProvisionSiteSuccess = {
  businessId: string;
  subdomain: string;
  storefrontUrl: string;
  claimUrl: string | null;
  claimExpiresAt: string;
  logoIngested: boolean;
  claimed?: true;
};

export type ProvisionSiteResult =
  | { ok: true; status: number; data: ProvisionSiteSuccess }
  | { ok: false; status: number | null; message: string };

/** Minimal shape-guard for the success response — matches `SuccessResponse` in SP's route.ts. */
const provisionSiteSuccessSchema = z.object({
  businessId: z.string().min(1),
  subdomain: z.string().min(1),
  storefrontUrl: z.string().min(1),
  claimUrl: z.string().min(1).nullable(),
  claimExpiresAt: z.string().min(1),
  logoIngested: z.boolean(),
  claimed: z.literal(true).optional(),
});

/** Best-effort extraction of `{error}` from a non-2xx JSON body. Never throws. */
function extractErrorMessage(bodyText: string): string | null {
  try {
    const parsed: unknown = JSON.parse(bodyText);
    if (
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      typeof (parsed as { error: unknown }).error === "string"
    ) {
      return (parsed as { error: string }).error;
    }
  } catch {
    // Body wasn't JSON (or had no `error` string) — fall through.
  }
  return null;
}

/**
 * Provision a SimplePress site for an Artisanal Futures shop.
 *
 * Serializes the body exactly once and signs that exact string, POSTs it to
 * SP's `/api/partner/provision`, and returns a typed result — this function
 * never throws. Network failures and timeouts resolve to `{ok: false,
 * status: null, ...}`; non-2xx HTTP responses resolve to `{ok: false, status,
 * ...}` with a user-displayable (never secret-leaking) message.
 */
export async function provisionSimplePressSite(
  input: ProvisionSiteInput,
): Promise<ProvisionSiteResult> {
  const body = JSON.stringify(input);
  const { timestamp, signature } = signPartnerRequest(
    body,
    env.AF_SP_WEBHOOK_SECRET,
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${env.SIMPLEPRESS_API_URL}/api/partner/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.SIMPLEPRESS_API_TOKEN}`,
        "X-Partner-Timestamp": String(timestamp),
        "X-Partner-Signature": signature,
      },
      body,
      signal: controller.signal,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "SimplePress did not respond in time."
        : "SimplePress did not respond.";
    return { ok: false, status: null, message };
  } finally {
    clearTimeout(timer);
  }

  const responseText = await res.text().catch(() => "");

  if (res.status === 200 || res.status === 201) {
    let json: unknown;
    try {
      json = JSON.parse(responseText);
    } catch {
      return {
        ok: false,
        status: res.status,
        message: "SimplePress returned an unreadable response.",
      };
    }
    const parsed = provisionSiteSuccessSchema.safeParse(json);
    if (!parsed.success) {
      return {
        ok: false,
        status: res.status,
        message: "SimplePress returned an unexpected response shape.",
      };
    }
    return { ok: true, status: res.status, data: parsed.data };
  }

  if (res.status === 401) {
    return {
      ok: false,
      status: res.status,
      message: "SimplePress rejected the request authentication.",
    };
  }

  if (res.status === 409) {
    return {
      ok: false,
      status: res.status,
      message:
        extractErrorMessage(responseText) ??
        "This site has already been provisioned with different details.",
    };
  }

  const message =
    extractErrorMessage(responseText) ??
    `SimplePress request failed (HTTP ${res.status}).`;
  return { ok: false, status: res.status, message };
}
