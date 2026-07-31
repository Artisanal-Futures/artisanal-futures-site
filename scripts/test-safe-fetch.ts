/**
 * Network-free smoke test for src/server/lib/safe-fetch.ts.
 *
 * This repo has no wired-up test framework (the `test` script's `jest` is
 * vestigial — jest isn't installed), so this is a plain `tsx` script run via
 * `pnpm exec tsx scripts/test-safe-fetch.ts`. It monkey-patches the
 * `node:dns/promises` singleton's `lookup` (the same technique as
 * simple-press's `vi.mock("node:dns/promises")` in src/lib/safe-fetch.test.ts,
 * adapted since there's no test runner here) so we can assert both:
 *
 *   1. bracketed IPv6 literals ([::1], [fd00::1], [fe80::1]) are rejected as
 *      blocked addresses WITHOUT ever reaching DNS resolution (this is the
 *      bug being fixed: `URL.hostname` keeps the brackets, so
 *      `net.isIP("[::1]")` used to return 0 and fall through to a real DNS
 *      lookup instead of being blocked outright), and
 *   2. a normal public hostname still resolves via the (mocked) DNS path, and
 *   3. every textual spelling of a private IPv6 address is blocked — the
 *      IPv4-mapped forms (dotted-quad *and* hex), the ::ffff:0:0/96 and NAT64
 *      64:ff9b::/96 wrappers, 6to4, and the whole of fe80::/10 rather than the
 *      literal characters "fe80".
 *
 * No real network calls are made.
 */
import dns from "node:dns/promises";

import {
  assertHostResolvesPublic,
  assertPublicHttpUrl,
  assertStaticallyPublicHttpUrl,
  retryDelayMs,
  SAFE_FETCH_USER_AGENT,
  SafeFetchError,
} from "../src/server/lib/safe-fetch";

let failures = 0;
let passes = 0;

function ok(label: string) {
  passes++;
  console.log(`  ok - ${label}`);
}

function fail(label: string, detail?: unknown) {
  failures++;
  console.error(`  FAIL - ${label}`);
  if (detail !== undefined) console.error("   ", detail);
}

async function expectRejects(
  label: string,
  fn: () => Promise<unknown>,
  messagePattern?: RegExp,
) {
  try {
    await fn();
    fail(label, "expected rejection but it resolved");
  } catch (err) {
    if (!(err instanceof SafeFetchError)) {
      fail(label, `expected SafeFetchError, got ${String(err)}`);
      return;
    }
    if (messagePattern && !messagePattern.test(err.message)) {
      fail(label, `message "${err.message}" did not match ${messagePattern}`);
      return;
    }
    ok(label);
  }
}

async function expectResolves(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    ok(label);
  } catch (err) {
    fail(label, err);
  }
}

// --- dns.lookup instrumentation -------------------------------------------
// Reject with a distinctive error if a literal-IP short-circuit ever falls
// through to DNS resolution — that's exactly the bug this fix closes.
let dnsLookupCallCount = 0;
let dnsLookupBehavior: (hostname: string) => Promise<{ address: string }[]> =
  async () => {
    throw new Error("UNEXPECTED_DNS_LOOKUP: no lookup should occur here");
  };

// `node:dns/promises`'s default export is a mutable singleton object, so
// patching `.lookup` here affects the same instance imported by safe-fetch.ts.
(dns as unknown as { lookup: typeof dns.lookup }).lookup = ((
  hostname: string,
  ..._rest: unknown[]
) => {
  dnsLookupCallCount++;
  return dnsLookupBehavior(hostname);
}) as typeof dns.lookup;

async function main() {
  // --- Bracketed IPv6 literals must be blocked WITHOUT a DNS lookup --------
  const blockedLiterals = ["[::1]", "[fd00::1]", "[fe80::1]"];

  for (const literal of blockedLiterals) {
    const url = new URL(`https://${literal}/x`);
    if (url.hostname !== literal) {
      fail(
        `sanity: URL.hostname preserves brackets for ${literal}`,
        `got hostname "${url.hostname}"`,
      );
      continue;
    } else {
      ok(`sanity: URL("https://${literal}/x").hostname === "${literal}" (brackets kept)`);
    }

    dnsLookupCallCount = 0;
    await expectRejects(
      `assertHostResolvesPublic rejects bracketed literal ${literal}`,
      () => assertHostResolvesPublic(url.hostname),
      /private|reserved/i,
    );
    if (dnsLookupCallCount !== 0) {
      fail(
        `assertHostResolvesPublic must not call dns.lookup for literal ${literal}`,
        `dns.lookup was called ${dnsLookupCallCount} time(s)`,
      );
    } else {
      ok(`assertHostResolvesPublic never calls dns.lookup for literal ${literal}`);
    }
  }

  // --- Unbracketed IPv6 literal still works (regression guard) ------------
  dnsLookupCallCount = 0;
  await expectRejects(
    "assertHostResolvesPublic still rejects unbracketed literal ::1",
    () => assertHostResolvesPublic("::1"),
    /private|reserved/i,
  );
  if (dnsLookupCallCount !== 0) {
    fail("unbracketed ::1 must not call dns.lookup", dnsLookupCallCount);
  } else {
    ok("unbracketed ::1 never calls dns.lookup");
  }

  // --- IPv6 has many spellings for the same private address ----------------
  // The old string-prefix checks only caught the dotted-quad form of an
  // IPv4-mapped address and the literal four characters "fe80". Each entry
  // below is a private/reserved address written in a form that slipped through.
  const blockedV6 = [
    ["::ffff:7f00:1", "IPv4-mapped 127.0.0.1 in hex form"],
    ["::ffff:a9fe:a9fe", "IPv4-mapped 169.254.169.254 (cloud metadata) in hex"],
    ["0:0:0:0:0:ffff:127.0.0.1", "fully-expanded IPv4-mapped 127.0.0.1"],
    ["::ffff:0:7f00:1", "IPv4-translated ::ffff:0:0/96 form of 127.0.0.1"],
    ["::ffff:0:169.254.169.254", "IPv4-translated cloud metadata"],
    ["64:ff9b::7f00:1", "NAT64 well-known prefix wrapping 127.0.0.1"],
    ["64:ff9b::169.254.169.254", "NAT64 wrapping cloud metadata"],
    ["64:ff9b:1::1", "NAT64 local-use prefix"],
    ["2002:7f00:1::1", "6to4 wrapping 127.0.0.1"],
    ["fe8f::1", "link-local fe80::/10 that does not start with the text fe80"],
    ["febf:ffff::1", "the very top of fe80::/10"],
    ["fc00::1", "ULA fc00::/7 (fc half)"],
    ["fdff::1", "ULA fc00::/7 (fd half)"],
    ["::", "unspecified"],
    ["::1", "loopback"],
    ["::127.0.0.1", "deprecated IPv4-compatible loopback"],
    ["ff02::1", "multicast"],
  ] as const;

  for (const [literal, why] of blockedV6) {
    dnsLookupCallCount = 0;
    await expectRejects(
      `assertHostResolvesPublic blocks ${literal} (${why})`,
      () => assertHostResolvesPublic(literal),
      /private|reserved/i,
    );
    if (dnsLookupCallCount !== 0) {
      fail(`${literal} must not reach dns.lookup`, dnsLookupCallCount);
    }
    // Bracketed, as a URL hostname would deliver it.
    await expectRejects(
      `assertHostResolvesPublic blocks bracketed [${literal}]`,
      () => assertHostResolvesPublic(new URL(`https://[${literal}]/x`).hostname),
      /private|reserved/i,
    );
  }

  // The same addresses must be refused by the static (no-DNS) boundary check
  // the API uses before storing a syncUrl.
  for (const [literal] of blockedV6) {
    await expectRejects(
      `assertStaticallyPublicHttpUrl rejects https://[${literal}]/products.json`,
      async () => assertStaticallyPublicHttpUrl(`https://[${literal}]/products.json`),
      /private|reserved/i,
    );
  }
  await expectResolves(
    "assertStaticallyPublicHttpUrl accepts a normal store URL",
    async () => assertStaticallyPublicHttpUrl("https://teststore.com/products.json"),
  );
  await expectRejects(
    "assertStaticallyPublicHttpUrl rejects a non-standard port",
    async () => assertStaticallyPublicHttpUrl("http://example.com:8080/x"),
    /port/i,
  );

  // Public IPv6 — including an IPv4-mapped *public* address — still passes.
  const allowedV6 = [
    ["2001:4860:4860::8888", "Google public DNS"],
    ["::ffff:93.184.216.34", "IPv4-mapped public address"],
    ["::ffff:5db8:d822", "the same public address in hex form"],
    ["64:ff9b::5db8:d822", "NAT64 wrapping a public address"],
    ["2002:5db8:d822::1", "6to4 wrapping a public address"],
  ] as const;
  for (const [literal, why] of allowedV6) {
    dnsLookupCallCount = 0;
    await expectResolves(
      `assertHostResolvesPublic still allows ${literal} (${why})`,
      () => assertHostResolvesPublic(literal),
    );
  }

  // --- A public bracketed IPv6 literal is NOT blocked ----------------------
  const publicV6 = new URL("https://[2001:4860:4860::8888]/x").hostname;
  dnsLookupCallCount = 0;
  await expectResolves(
    "assertHostResolvesPublic accepts a public bracketed IPv6 literal (Google DNS)",
    () => assertHostResolvesPublic(publicV6),
  );
  if (dnsLookupCallCount !== 0) {
    fail("public literal must not call dns.lookup", dnsLookupCallCount);
  } else {
    ok("public bracketed literal never calls dns.lookup");
  }

  // --- assertPublicHttpUrl: a normal public https URL still passes URL
  // validation (scheme/credentials/port checks), independent of DNS. --------
  await expectResolves("assertPublicHttpUrl accepts a normal https URL", async () => {
    const url = assertPublicHttpUrl("https://example.com/store");
    if (url.hostname !== "example.com") {
      throw new Error(`unexpected hostname "${url.hostname}"`);
    }
  });

  await expectRejects(
    "assertPublicHttpUrl rejects non-http(s) schemes",
    async () => {
      assertPublicHttpUrl("ftp://example.com/x");
    },
    /http/i,
  );

  // --- A normal public hostname resolves through the (mocked) DNS path ----
  dnsLookupBehavior = async () => [{ address: "93.184.216.34" }]; // public IP
  dnsLookupCallCount = 0;
  await expectResolves(
    "assertHostResolvesPublic resolves a normal hostname via mocked DNS",
    () => assertHostResolvesPublic("example.com"),
  );
  if (dnsLookupCallCount !== 1) {
    fail(
      "expected exactly one dns.lookup call for a plain hostname",
      dnsLookupCallCount,
    );
  } else {
    ok("assertHostResolvesPublic calls dns.lookup exactly once for a plain hostname");
  }

  // --- DNS rebinding: a hostname that resolves to a private address is
  // still rejected. ---------------------------------------------------------
  dnsLookupBehavior = async () => [{ address: "169.254.169.254" }];
  dnsLookupCallCount = 0;
  await expectRejects(
    "assertHostResolvesPublic rejects a hostname resolving to a private address",
    () => assertHostResolvesPublic("sneaky.example.com"),
    /private|reserved/i,
  );

  // --- Rate-limit backoff --------------------------------------------------
  // Hosted storefronts (Shopify behind Cloudflare especially) answer with 429
  // and often a `Retry-After`. These assert we wait the amount we're told,
  // fall back to sane exponential backoff when we're told nothing, and refuse
  // to hold a request open for an unreasonably long cooldown.

  function assertEq(label: string, actual: unknown, expected: unknown) {
    if (actual === expected) ok(label);
    else fail(label, `expected ${String(expected)}, got ${String(actual)}`);
  }

  function assertTrue(label: string, value: boolean, detail?: unknown) {
    if (value) ok(label);
    else fail(label, detail);
  }

  assertEq(
    "Retry-After in seconds is honoured",
    retryDelayMs("2", 0),
    2000,
  );
  assertEq(
    "Retry-After of 0 falls through to backoff",
    retryDelayMs("0", 0),
    1000,
  );
  assertEq(
    "no Retry-After backs off exponentially (attempt 0)",
    retryDelayMs(null, 0),
    1000,
  );
  assertEq(
    "no Retry-After backs off exponentially (attempt 2)",
    retryDelayMs(null, 2),
    4000,
  );
  // Regression: Shopify's storefront throttle answers `Retry-After: 60` with a
  // `local_rate_limited` body. An earlier 30s ceiling refused that and failed
  // the sync outright, throwing away a request that would have succeeded a
  // minute later. Waiting a minute is nothing for weekly background work.
  assertEq(
    "Shopify's 60s cooldown is waited out, not refused",
    retryDelayMs("60", 0),
    60_000,
  );
  assertEq(
    "a two-minute cooldown is still honoured",
    retryDelayMs("120", 0),
    120_000,
  );
  assertEq(
    "an unreasonably long Retry-After gives up instead of stalling",
    retryDelayMs("3600", 0),
    null,
  );
  assertEq(
    "backoff is capped even at high attempt counts",
    retryDelayMs(null, 20),
    120_000,
  );

  const throttled = new SafeFetchError("rate limited", {
    status: 429,
    retryAfter: "5",
  });
  assertEq("a 429 is marked retryable", throttled.isRetryable, true);
  assertEq("its status is preserved", throttled.status, 429);
  assertEq(
    "a 404 is not retryable",
    new SafeFetchError("gone", { status: 404 }).isRetryable,
    false,
  );
  assertEq(
    "a network-level failure is not retryable",
    new SafeFetchError("network").isRetryable,
    false,
  );

  // We must identify ourselves — a missing User-Agent is what gets us 429'd in
  // the first place — and must never claim to be a browser.
  assertTrue(
    "the user agent names this bot",
    /ArtisanalFuturesBot/.test(SAFE_FETCH_USER_AGENT),
    SAFE_FETCH_USER_AGENT,
  );
  assertTrue(
    "the user agent carries a contact URL",
    /https:\/\/artisanalfutures\.org/.test(SAFE_FETCH_USER_AGENT),
    SAFE_FETCH_USER_AGENT,
  );
  assertTrue(
    "the user agent does not impersonate a browser",
    !/Mozilla|Chrome|Safari|AppleWebKit/i.test(SAFE_FETCH_USER_AGENT),
    SAFE_FETCH_USER_AGENT,
  );

  console.log(`\n${passes} passed, ${failures} failed`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Unhandled error running tests:", err);
  process.exitCode = 1;
});
