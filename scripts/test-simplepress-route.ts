/**
 * Unit test for the pure parts of the `/api/simplepress` route.
 *
 * Like `scripts/test-partner-auth.ts`, this repo has no working test framework,
 * so this is a plain `tsx` script: it asserts each case, prints PASS/FAIL, and
 * `process.exit(1)` on any failure.
 *
 *   pnpm exec tsx scripts/test-simplepress-route.ts
 *
 * It exercises only the DB-free pieces:
 *   - `postBodySchema` accepts the new contract body and rejects the OLD v1 body;
 *   - `checkRateLimit` blocks after N;
 *   - `authorizeRequest` accept/reject paths, including the no-downgrade rule.
 *
 * These import from `src/app/api/simplepress/_lib.ts`, which imports NO env, so
 * the script runs without env validation.
 */
import { signPartnerRequest } from "~/server/lib/partner-auth";
import { checkRateLimit } from "~/server/lib/rate-limit";

import {
  authorizeRequest,
  postBodySchema,
  type AuthorizeSecrets,
} from "~/app/api/simplepress/_lib";

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

// ---------------------------------------------------------------------------
// postBodySchema — new contract body accepted, old v1 body rejected
// ---------------------------------------------------------------------------
{
  const validClaimed = {
    code: "A1B2C3D4",
    event: "claimed",
    status: "ACTIVE",
    subdomain: "rosas-textiles",
    deploymentUrl: "https://rosas-textiles.simplepress.dev",
    customDomain: null,
    errorMessage: null,
  };
  check(
    "schema: accepts the contract body (claimed)",
    postBodySchema.safeParse(validClaimed).success,
  );

  check(
    "schema: accepts customDomain omitted entirely",
    postBodySchema.safeParse({
      code: "A1B2C3D4",
      event: "claimed",
      status: "ACTIVE",
      subdomain: "rosas-textiles",
      deploymentUrl: "https://rosas-textiles.simplepress.dev",
    }).success,
  );

  check(
    "schema: accepts a non-null bare customDomain",
    postBodySchema.safeParse({
      code: "A1B2C3D4",
      event: "claimed",
      status: "ACTIVE",
      subdomain: "rosas-textiles",
      deploymentUrl: "https://rosas.example",
      customDomain: "rosas.example",
    }).success,
  );

  check(
    "schema: accepts the failed event",
    postBodySchema.safeParse({
      code: "A1B2C3D4",
      event: "failed",
      status: "FAILED",
      subdomain: "rosas-textiles",
      deploymentUrl: "https://rosas-textiles.simplepress.dev",
      errorMessage: "build failed",
    }).success,
  );

  // OLD v1 body — the exact shape SP used to send. Must be rejected now.
  check(
    "schema: REJECTS the old v1 body {artisanToken, subdomain, customDomain}",
    !postBodySchema.safeParse({
      artisanToken: "A1B2C3D4",
      subdomain: "rosas-textiles",
      customDomain: "https://rosas-textiles.simplepress.dev",
    }).success,
  );

  check(
    "schema: rejects an unknown event value",
    !postBodySchema.safeParse({ ...validClaimed, event: "provisioned" }).success,
  );

  check(
    "schema: rejects a non-URL deploymentUrl",
    !postBodySchema.safeParse({ ...validClaimed, deploymentUrl: "not-a-url" })
      .success,
  );

  check(
    "schema: rejects an empty code",
    !postBodySchema.safeParse({ ...validClaimed, code: "" }).success,
  );
}

// ---------------------------------------------------------------------------
// checkRateLimit — blocks after N within a window
// ---------------------------------------------------------------------------
{
  const key = `test-key-${Date.now()}-${Math.random()}`;
  const allowed = [
    checkRateLimit(key, { limit: 3, windowMs: 60_000 }),
    checkRateLimit(key, { limit: 3, windowMs: 60_000 }),
    checkRateLimit(key, { limit: 3, windowMs: 60_000 }),
  ];
  const blocked = checkRateLimit(key, { limit: 3, windowMs: 60_000 });
  check(
    "rate-limit: first 3 allowed under limit 3",
    allowed.every((x) => x === true),
    JSON.stringify(allowed),
  );
  check("rate-limit: 4th request blocked", blocked === false);

  // A different key has an independent window.
  check(
    "rate-limit: a different key is independent",
    checkRateLimit(`${key}-other`, { limit: 3, windowMs: 60_000 }) === true,
  );

  // A tiny window that has already elapsed resets the counter.
  const shortKey = `short-${Date.now()}-${Math.random()}`;
  const first = checkRateLimit(shortKey, { limit: 1, windowMs: 1 });
  const secondImmediate = checkRateLimit(shortKey, { limit: 1, windowMs: 1 });
  // windowMs:1 means the window is essentially always already expired on the
  // next tick; both should generally pass. Assert at least the first does and
  // the mechanism does not throw.
  check(
    "rate-limit: 1ms window allows the first request",
    first === true,
    `first=${first} second=${secondImmediate}`,
  );
}

// ---------------------------------------------------------------------------
// authorizeRequest — accept/reject paths incl. the no-downgrade rule
// ---------------------------------------------------------------------------
{
  const SECRETS: AuthorizeSecrets = {
    callbackToken: "cb-token",
    hmacSecret: "hmac-secret",
    legacyBearer: "legacy-hash-secret",
  };
  const rawBody = JSON.stringify({ code: "A1B2C3D4", event: "claimed" });
  const now = Math.floor(Date.now() / 1000);

  function signedReq(args: {
    bearer: string;
    hmacSecret: string;
    rawBody: string;
    timestamp?: number;
    signatureOverride?: string;
    includeSignature?: boolean;
  }): Request {
    const ts = args.timestamp ?? now;
    const { signature } = signPartnerRequest(args.rawBody, args.hmacSecret, ts);
    const headers: Record<string, string> = {
      authorization: `Bearer ${args.bearer}`,
      "x-partner-timestamp": String(ts),
      "content-type": "application/json",
    };
    if (args.includeSignature !== false) {
      headers["x-partner-signature"] = args.signatureOverride ?? signature;
    }
    return new Request("https://af.example/api/simplepress", {
      method: "POST",
      headers,
      body: args.rawBody,
    });
  }

  // 1. Valid signed request → passes.
  check(
    "authorize: valid signed partner request passes",
    authorizeRequest(
      signedReq({
        bearer: SECRETS.callbackToken,
        hmacSecret: SECRETS.hmacSecret,
        rawBody,
      }),
      rawBody,
      SECRETS,
    ) === true,
  );

  // 2. Unsigned request with the correct legacy bearer → passes fallback.
  {
    const req = new Request("https://af.example/api/simplepress", {
      method: "POST",
      headers: { authorization: `Bearer ${SECRETS.legacyBearer}` },
      body: rawBody,
    });
    check(
      "authorize: unsigned request with legacy bearer passes fallback",
      authorizeRequest(req, rawBody, SECRETS) === true,
    );
  }

  // 3. Unsigned request with a WRONG bearer → fails.
  {
    const req = new Request("https://af.example/api/simplepress", {
      method: "POST",
      headers: { authorization: "Bearer wrong-token" },
      body: rawBody,
    });
    check(
      "authorize: unsigned request with wrong bearer fails",
      authorizeRequest(req, rawBody, SECRETS) === false,
    );
  }

  // 4. Signature header PRESENT but bad, WITH the correct legacy bearer → still
  //    fails. A signed request must pass full verification — no downgrade.
  {
    const req = signedReq({
      bearer: SECRETS.legacyBearer, // correct legacy bearer...
      hmacSecret: "attacker-key", // ...but signature is bogus
      rawBody,
    });
    check(
      "authorize: bad signature + correct legacy bearer STILL fails (no downgrade)",
      authorizeRequest(req, rawBody, SECRETS) === false,
    );
  }

  // 4b. Signature header present but bad, WITH the correct callback bearer →
  //     also fails (primary fails on signature, no fallback because signed).
  {
    const req = signedReq({
      bearer: SECRETS.callbackToken,
      hmacSecret: "attacker-key",
      rawBody,
    });
    check(
      "authorize: tampered signature with correct callback bearer fails",
      authorizeRequest(req, rawBody, SECRETS) === false,
    );
  }

  // 5. Signed with correct key but a stale timestamp → fails; and since a
  //    signature is present, no legacy fallback rescues it.
  {
    const req = signedReq({
      bearer: SECRETS.callbackToken,
      hmacSecret: SECRETS.hmacSecret,
      rawBody,
      timestamp: now - 10_000,
    });
    check(
      "authorize: valid signature but stale timestamp fails",
      authorizeRequest(req, rawBody, SECRETS) === false,
    );
  }

  // 6. GET-style: signed over the canonical query string passes.
  {
    const q = "code=A1B2C3D4";
    const req = signedReq({
      bearer: SECRETS.callbackToken,
      hmacSecret: SECRETS.hmacSecret,
      rawBody: q,
    });
    check(
      "authorize: GET-style request signed over `code=` query passes",
      authorizeRequest(req, q, SECRETS) === true,
    );
  }

  // 7. No auth at all → fails.
  {
    const req = new Request("https://af.example/api/simplepress", {
      method: "POST",
      body: rawBody,
    });
    check(
      "authorize: request with no auth headers fails",
      authorizeRequest(req, rawBody, SECRETS) === false,
    );
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("");
console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("simplepress-route test FAILED");
  process.exit(1);
}
console.log("simplepress-route test PASSED");
