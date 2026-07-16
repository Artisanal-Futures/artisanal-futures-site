/**
 * Shared cross-repo vector test for `src/server/lib/partner-auth.ts`.
 *
 * This repo has NO working test framework (the "test": "jest" package script is
 * vestigial — there is no jest config or dependency). It DOES have `tsx`, so
 * this is a plain script: it asserts every case, prints PASS/FAIL lines, and
 * `process.exit(1)` on any failure.
 *
 * Run it:
 *   pnpm exec tsx scripts/test-partner-auth.ts
 *
 * The PARTNER_AUTH_TEST_VECTORS below are the SAME fixtures hard-coded in the
 * SimplePress repo's `src/lib/partner-auth.test.ts`. They are the byte-for-byte
 * interop proof: if either repo's HMAC drifts, these signatures stop matching.
 * Do NOT change a value here without updating the identical block in SP.
 */
import {
  signPartnerRequest,
  timingSafeCompare,
  verifyPartnerRequest,
} from "~/server/lib/partner-auth";

// ---------------------------------------------------------------------------
// SHARED CROSS-REPO TEST VECTORS — must match simple-press
// src/lib/partner-auth.test.ts. Deterministic fixtures for
// hmac-sha256(secret, `${timestamp}.${body}`), formatted `v1=<hex>`.
// ---------------------------------------------------------------------------
const PARTNER_AUTH_TEST_VECTORS = [
  {
    secret: "test-webhook-secret-1",
    timestamp: 1752537600,
    body: '{"afProvisionCode":"A1B2C3D4","businessName":"Rosa\'s Textiles","email":"rosa@example.com"}',
    expectedSignature:
      "v1=c7fb2f69f12dd3ad4affabb128701857dfec3418a6a3be6099e59eee26f8a5cd",
  },
  {
    // GET request: rawBody is the canonical query string.
    secret: "test-webhook-secret-1",
    timestamp: 1752537600,
    body: "code=A1B2C3D4",
    expectedSignature:
      "v1=28cb70935273a828070170d5734df30d80c8500c1cacb473322ab9d237ffcc91",
  },
  {
    secret: "another-secret",
    timestamp: 1752537661,
    body: "{}",
    expectedSignature:
      "v1=5e87ab3766cf4b4f4609359fa084a7287e5ed97d05e48c18d83d6b47aa43292f",
  },
] as const;

const BEARER = "inbound-partner-bearer-token";

let passed = 0;
let failed = 0;

function check(label: string, cond: boolean, detail?: string): void {
  if (cond) {
    passed++;
    console.log(`PASS  ${label}`);
  } else {
    failed++;
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function assertEqualResult(
  label: string,
  actual: unknown,
  expected: unknown,
): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(label, a === e, `expected ${e}, got ${a}`);
}

/** Build a correctly-signed Request from a vector-like fixture. */
function makeSignedRequest(args: {
  bearer: string;
  hmacSecret: string;
  rawBody: string;
  timestamp: number;
  signature?: string; // override to forge/tamper
}): Request {
  const { signature } = signPartnerRequest(
    args.rawBody,
    args.hmacSecret,
    args.timestamp,
  );
  return new Request("https://sp.example/api/partner/provision", {
    method: "POST",
    headers: {
      authorization: `Bearer ${args.bearer}`,
      "x-partner-timestamp": String(args.timestamp),
      "x-partner-signature": args.signature ?? signature,
      "content-type": "application/json",
    },
    body: args.rawBody,
  });
}

// ---------------------------------------------------------------------------
// signPartnerRequest — shared cross-repo vectors (byte-for-byte interop)
// ---------------------------------------------------------------------------
for (const v of PARTNER_AUTH_TEST_VECTORS) {
  const { signature, timestamp } = signPartnerRequest(
    v.body,
    v.secret,
    v.timestamp,
  );
  check(
    `vector signs (${v.body.slice(0, 32)}...) -> ${v.expectedSignature.slice(0, 14)}...`,
    signature === v.expectedSignature,
    `expected ${v.expectedSignature}, got ${signature}`,
  );
  check(`vector echoes its timestamp (${v.timestamp})`, timestamp === v.timestamp);
}

check(
  "signature is formatted v1=<64 hex>",
  /^v1=[0-9a-f]{64}$/.test(signPartnerRequest("{}", "s", 1).signature),
);

{
  const before = Math.floor(Date.now() / 1000);
  const { timestamp } = signPartnerRequest("{}", "s");
  const after = Math.floor(Date.now() / 1000);
  check(
    "defaults timestamp to now when omitted",
    timestamp >= before && timestamp <= after,
  );
}

// ---------------------------------------------------------------------------
// timingSafeCompare
// ---------------------------------------------------------------------------
check("timingSafeCompare: equal strings -> true", timingSafeCompare("hello world", "hello world") === true);
check("timingSafeCompare: equal-length differing -> false", timingSafeCompare("hello world", "hello w0rld") === false);
check("timingSafeCompare: length mismatch -> false (no throw)", timingSafeCompare("short", "a much longer string") === false);
check("timingSafeCompare: empty vs non-empty -> false", timingSafeCompare("", "x") === false);
check("timingSafeCompare: two empty strings -> true", timingSafeCompare("", "") === true);

// ---------------------------------------------------------------------------
// verifyPartnerRequest
// ---------------------------------------------------------------------------
{
  const rawBody = PARTNER_AUTH_TEST_VECTORS[0].body;
  const hmacSecret = PARTNER_AUTH_TEST_VECTORS[0].secret;
  const now = PARTNER_AUTH_TEST_VECTORS[0].timestamp;

  // accepts a correctly-signed request
  assertEqualResult(
    "verify: accepts a correctly-signed request",
    verifyPartnerRequest(
      makeSignedRequest({ bearer: BEARER, hmacSecret, rawBody, timestamp: now }),
      { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now },
    ),
    { ok: true },
  );

  // accepts a GET-style request signed over its query string
  {
    const q = "code=A1B2C3D4";
    assertEqualResult(
      "verify: accepts GET-style request signed over query string",
      verifyPartnerRequest(
        makeSignedRequest({ bearer: BEARER, hmacSecret, rawBody: q, timestamp: now }),
        { bearer: BEARER, hmacSecret, rawBody: q, nowSeconds: now },
      ),
      { ok: true },
    );
  }

  // rejects wrong bearer
  assertEqualResult(
    "verify: rejects a wrong bearer",
    verifyPartnerRequest(
      makeSignedRequest({ bearer: "wrong-token", hmacSecret, rawBody, timestamp: now }),
      { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now },
    ),
    { ok: false, reason: "bearer" },
  );

  // rejects missing Authorization header
  {
    const req = new Request("https://sp.example/x", {
      method: "POST",
      headers: {
        "x-partner-timestamp": String(now),
        "x-partner-signature": signPartnerRequest(rawBody, hmacSecret, now).signature,
      },
      body: rawBody,
    });
    assertEqualResult(
      "verify: rejects a missing Authorization header",
      verifyPartnerRequest(req, { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now }),
      { ok: false, reason: "bearer" },
    );
  }

  // rejects a stale timestamp (too old, >300s)
  assertEqualResult(
    "verify: rejects a stale timestamp (>300s old)",
    verifyPartnerRequest(
      makeSignedRequest({ bearer: BEARER, hmacSecret, rawBody, timestamp: now }),
      { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now + 301 },
    ),
    { ok: false, reason: "timestamp" },
  );

  // rejects a future timestamp (>300s ahead)
  assertEqualResult(
    "verify: rejects a future timestamp (>300s ahead)",
    verifyPartnerRequest(
      makeSignedRequest({ bearer: BEARER, hmacSecret, rawBody, timestamp: now }),
      { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now - 301 },
    ),
    { ok: false, reason: "timestamp" },
  );

  // accepts a timestamp exactly at the +300s boundary
  assertEqualResult(
    "verify: accepts +300s boundary (inclusive)",
    verifyPartnerRequest(
      makeSignedRequest({ bearer: BEARER, hmacSecret, rawBody, timestamp: now }),
      { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now + 300 },
    ),
    { ok: true },
  );

  // accepts a timestamp exactly at the -300s boundary
  assertEqualResult(
    "verify: accepts -300s boundary (inclusive)",
    verifyPartnerRequest(
      makeSignedRequest({ bearer: BEARER, hmacSecret, rawBody, timestamp: now }),
      { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now - 300 },
    ),
    { ok: true },
  );

  // rejects a non-numeric timestamp header
  {
    const req = new Request("https://sp.example/x", {
      method: "POST",
      headers: {
        authorization: `Bearer ${BEARER}`,
        "x-partner-timestamp": "not-a-number",
        "x-partner-signature": signPartnerRequest(rawBody, hmacSecret, now).signature,
      },
      body: rawBody,
    });
    assertEqualResult(
      "verify: rejects a non-numeric timestamp header",
      verifyPartnerRequest(req, { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now }),
      { ok: false, reason: "timestamp" },
    );
  }

  // rejects a tampered body (signature no longer matches)
  assertEqualResult(
    "verify: rejects a tampered body",
    verifyPartnerRequest(
      makeSignedRequest({ bearer: BEARER, hmacSecret, rawBody, timestamp: now }),
      { bearer: BEARER, hmacSecret, rawBody: rawBody.replace("Rosa", "Mallory"), nowSeconds: now },
    ),
    { ok: false, reason: "signature" },
  );

  // rejects a valid-format signature computed with the wrong key
  assertEqualResult(
    "verify: rejects signature computed with the wrong key",
    verifyPartnerRequest(
      makeSignedRequest({ bearer: BEARER, hmacSecret: "attacker-key", rawBody, timestamp: now }),
      { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now },
    ),
    { ok: false, reason: "signature" },
  );

  // rejects a malformed signature header (no v1= prefix)
  assertEqualResult(
    "verify: rejects a malformed signature header (no v1= prefix)",
    verifyPartnerRequest(
      makeSignedRequest({ bearer: BEARER, hmacSecret, rawBody, timestamp: now, signature: "deadbeef" }),
      { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now },
    ),
    { ok: false, reason: "malformed" },
  );

  // rejects a missing signature header as malformed
  {
    const req = new Request("https://sp.example/x", {
      method: "POST",
      headers: {
        authorization: `Bearer ${BEARER}`,
        "x-partner-timestamp": String(now),
      },
      body: rawBody,
    });
    assertEqualResult(
      "verify: rejects a missing signature header as malformed",
      verifyPartnerRequest(req, { bearer: BEARER, hmacSecret, rawBody, nowSeconds: now }),
      { ok: false, reason: "malformed" },
    );
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("");
console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("partner-auth vector test FAILED");
  process.exit(1);
}
console.log("partner-auth vector test PASSED");
