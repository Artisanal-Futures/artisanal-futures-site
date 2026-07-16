import { NextResponse } from "next/server";

import { env } from "~/env";
import {
  getSimplePressProvisionForExchange,
  updateSimplePressProvisionFromExchange,
} from "~/server/jobs/simplepress-exchange";
import { checkRateLimit, getClientIp } from "~/server/lib/rate-limit";

import { authorizeRequest, postBodySchema } from "./_lib";

/**
 * Machine-to-machine service API for the SimplePress integration.
 *
 *   GET  ?code=<accessToken>  → legacy token exchange → {email, businessName}
 *   POST {contract body}      → provisioning status callback → {ok:true}
 *
 * Both verbs: rate-limited per client IP, then authorized via `authorize`
 * (partner HMAC verification with a temporary static-bearer cutover fallback).
 * See `docs/integrations/simplepress-provisioning.md` item A6.
 */

/** Bind the pure `authorizeRequest` to this deployment's secrets. */
function authorize(req: Request, rawBody: string): boolean {
  return authorizeRequest(req, rawBody, {
    callbackToken: env.SIMPLEPRESS_CALLBACK_TOKEN,
    hmacSecret: env.AF_SP_WEBHOOK_SECRET,
    // DEPRECATED cutover bearer — remove once SP always signs (build step 7).
    legacyBearer: env.SIMPLEPRESS_HASH_SECRET,
  });
}

/** 30 requests/min per IP. Returns a 429 response when exhausted, else null. */
function enforceRateLimit(req: Request): NextResponse | null {
  if (checkRateLimit(getClientIp(req))) return null;
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}

export async function GET(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  const code = new URL(req.url).searchParams.get("code")?.trim() ?? "";

  // For GET the HMAC is computed over the canonical query string `code=<value>`
  // — the exact bytes SP signs in its onboarding fetch
  // (`code=${encodeURIComponent(aftoken)}`). URL parsing decoded the value, so
  // re-encode it to reconstruct those bytes. A missing code yields `code=`,
  // which no legitimately-signed request will match (→ 401 before the 400).
  const rawBody = `code=${encodeURIComponent(code)}`;
  if (!authorize(req, rawBody)) {
    // Never leak which check failed to the caller; a warn is fine server-side.
    console.warn("[simplepress] GET authorization failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const payload = await getSimplePressProvisionForExchange(code);
  if (!payload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { email: payload.email, businessName: payload.businessName },
    { status: 200 },
  );
}

export async function POST(req: Request) {
  const limited = enforceRateLimit(req);
  if (limited) return limited;

  // Read the raw body text BEFORE parsing — the HMAC is over the raw bytes, so
  // a re-serialized object would not match SP's signature.
  const rawBody = await req.text();

  if (!authorize(req, rawBody)) {
    console.warn("[simplepress] POST authorization failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await updateSimplePressProvisionFromExchange(parsed.data);

  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Subdomain or custom domain already in use" },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true });
}
