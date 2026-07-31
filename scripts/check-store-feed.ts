/**
 * Probe one storefront's product feed and report exactly what came back.
 *
 * Built to answer a specific question: when a shop's sync fails with "the store
 * is rate limiting us", is it *that store* refusing non-browser clients, or is
 * it *our server's IP* having earned a temporary cooldown? Those look identical
 * in the app but have opposite fixes, and the way to tell them apart is to run
 * the same request from two different IPs.
 *
 *   # from your laptop
 *   pnpm check-store-feed https://example.com shopify
 *
 *   # from the Coolify container, same command
 *   #   200 here + 200 on laptop -> fine, something else is wrong
 *   #   429 here + 200 on laptop -> our server IP is throttled; wait it out
 *   #   429 in both              -> the store blocks non-browser clients
 *
 * Read-only: issues GET requests to a public storefront and touches no
 * database. Uses the same `fetchStoreFeed` the app does, so a pass here means
 * the real sync would pass too.
 */

import {
  fetchStoreFeed,
  FETCHABLE_PLATFORMS,
  type FetchablePlatform,
} from "../src/server/lib/store-feed";
import { SAFE_FETCH_USER_AGENT, SafeFetchError } from "../src/server/lib/safe-fetch";

const [rawUrl, rawPlatform] = process.argv.slice(2);

if (!rawUrl || !rawPlatform) {
  console.error(
    `Usage: pnpm check-store-feed <store-url> <platform>\n\n` +
      `  platform: ${FETCHABLE_PLATFORMS.join(" | ")}\n\n` +
      `Example:\n` +
      `  pnpm check-store-feed https://example.com shopify`,
  );
  process.exit(1);
}

if (!FETCHABLE_PLATFORMS.includes(rawPlatform as FetchablePlatform)) {
  console.error(
    `"${rawPlatform}" is not an automatically fetchable platform.\n` +
      `Expected one of: ${FETCHABLE_PLATFORMS.join(", ")}\n` +
      `(Square has no public feed — those shops are paste-only.)`,
  );
  process.exit(1);
}

const platform = rawPlatform as FetchablePlatform;

/** Headers that actually tell you something about who rejected you. */
const INTERESTING_HEADERS = [
  "server",
  "retry-after",
  "cf-ray",
  "cf-cache-status",
  "x-request-id",
  "x-shopify-stage",
  "x-sorting-hat-shopid",
];

/**
 * Raw single request, bypassing retries, so we see the *first* status rather
 * than the outcome after backoff.
 */
let retryAfterSeconds: number | null = null;

async function rawProbe(url: string) {
  console.log(`\n1. Raw probe  ${url}`);
  console.log(`   User-Agent: ${SAFE_FETCH_USER_AGENT}`);
  try {
    const res = await fetch(url, {
      redirect: "manual",
      headers: {
        accept: "application/json, text/plain;q=0.9, */*;q=0.5",
        "user-agent": SAFE_FETCH_USER_AGENT,
      },
    });

    console.log(`   -> HTTP ${res.status} ${res.statusText}`);
    for (const name of INTERESTING_HEADERS) {
      const value = res.headers.get(name);
      if (value) console.log(`      ${name}: ${value}`);
    }

    const retryAfter = res.headers.get("retry-after");
    if (retryAfter) {
      const parsed = Number(retryAfter);
      if (Number.isFinite(parsed)) retryAfterSeconds = parsed;
    }

    const body = await res.text();
    if (!res.ok) {
      console.log(`      body: ${body.slice(0, 300).replace(/\s+/g, " ")}`);
    } else {
      console.log(`      body: ${body.length.toLocaleString()} bytes`);
    }

    return res.status;
  } catch (err) {
    console.log(`   -> network error: ${String(err)}`);
    return null;
  }
}

/** The real path the sync uses, including pagination, retries and backoff. */
async function realFetch() {
  console.log(`\n2. Real feed fetch (${platform}, with retries)`);
  const startedAt = Date.now();
  try {
    const result = await fetchStoreFeed({ website: rawUrl!, platform });
    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`   -> OK: ${result.count} products in ${seconds}s`);
    if (result.insecureTLSCode) {
      console.log(
        `      NOTE: TLS verification was skipped (${result.insecureTLSCode}) — this store's certificate is invalid.`,
      );
    }
    return true;
  } catch (err) {
    const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    if (err instanceof SafeFetchError) {
      console.log(`   -> FAILED after ${seconds}s: ${err.message}`);
      if (err.status) console.log(`      status: ${err.status}`);
      if (err.retryAfter) console.log(`      retry-after: ${err.retryAfter}`);
    } else {
      console.log(`   -> FAILED after ${seconds}s: ${String(err)}`);
    }
    return false;
  }
}

function verdict(probeStatus: number | null, feedOk: boolean) {
  console.log(`\n${"=".repeat(64)}`);
  if (feedOk) {
    console.log("VERDICT: this store syncs fine from this machine.");
    console.log(
      "If the app still fails, run this same command inside the Coolify\n" +
        "container — a different result there means the server's IP is throttled.",
    );
    return 0;
  }
  if (probeStatus === 429) {
    // A 429 that names its own cooldown is cooperative throttling, not a
    // refusal — the store is telling us exactly when to come back.
    if (retryAfterSeconds !== null) {
      console.log(
        `VERDICT: HTTP 429 — ordinary throttling, ${retryAfterSeconds}s cooldown.`,
      );
      console.log(
        "The store is not blocking us; it asked us to come back shortly.\n" +
          `Wait ${retryAfterSeconds}s and re-run this command — it should pass.\n` +
          "The sync honours this automatically and will retry on its own.",
      );
      return 1;
    }
    console.log("VERDICT: HTTP 429 with no Retry-After — throttled, duration unknown.");
    console.log(
      "Run this from a second machine on a different network.\n" +
        "  200 there -> this machine's IP is in a cooldown; wait it out.\n" +
        "  429 there -> the store refuses non-browser clients outright.",
    );
    return 1;
  }
  if (probeStatus === 403 || probeStatus === 430) {
    console.log(`VERDICT: HTTP ${probeStatus} — bot protection, not rate limiting.`);
    console.log(
      "Waiting will not help. Options: ask the artisan for a Shopify\n" +
        "Storefront API token, ask them to allowlist us, or keep that shop\n" +
        "on the manual paste flow.",
    );
    return 1;
  }
  console.log(`VERDICT: failed with HTTP ${probeStatus ?? "network error"}.`);
  console.log("See the body snippet above — it usually says why.");
  return 1;
}

async function main() {
  console.log(`Checking ${rawUrl} as ${platform}`);

  // Mirror the URL the real fetcher would build for this platform.
  const origin = new URL(
    /^https?:\/\//i.test(rawUrl!) ? rawUrl! : `https://${rawUrl!}`,
  ).origin;
  const probeUrl =
    platform === "shopify"
      ? `${origin}/products.json?limit=250&page=1`
      : platform === "simplepress"
        ? `${origin}/api/products`
        : platform === "wordpress"
          ? `${origin}/wp-json/wp/v2/product?per_page=100&page=1`
          : `${rawUrl}${rawUrl!.includes("?") ? "&" : "?"}format=json`;

  const probeStatus = await rawProbe(probeUrl);
  const feedOk = await realFetch();
  process.exit(verdict(probeStatus, feedOk));
}

void main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
