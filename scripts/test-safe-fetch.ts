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
 *   2. a normal public hostname still resolves via the (mocked) DNS path.
 *
 * No real network calls are made.
 */
import dns from "node:dns/promises";

import {
  assertHostResolvesPublic,
  assertPublicHttpUrl,
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

  console.log(`\n${passes} passed, ${failures} failed`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Unhandled error running tests:", err);
  process.exitCode = 1;
});
