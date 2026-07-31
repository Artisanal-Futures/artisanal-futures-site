import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

/**
 * SSRF-hardened fetch helper.
 *
 * The product migration "fetch from my store" feature makes the server issue an
 * outbound HTTP request to a URL derived from a shop's stored `website`. Even
 * though that value is set by admins/artisans, we never want the server to be
 * tricked into hitting internal/metadata endpoints (e.g. 169.254.169.254,
 * localhost, RFC1918 ranges). This module validates the URL, resolves the host,
 * and refuses any address that maps to a private/reserved range. It also caps
 * the response size and time, and refuses redirects (a common SSRF bypass).
 *
 * Residual risk: there is a small TOCTOU window between DNS resolution here and
 * the resolution performed by `fetch`. Given the host is an admin-configured
 * shop website (not arbitrary user input) and redirects are refused, this is an
 * acceptable trade-off for this feature.
 *
 * TLS trade-off: many small-business stores serve expired/misconfigured
 * certificates. When `allowInsecureTLSFallback` is set, a request that fails
 * *specifically* with a certificate error is retried with TLS verification
 * disabled. Every other protection (private-IP block, no redirects, size/time
 * caps) still applies, so the only thing relaxed is server-identity
 * verification for an admin-initiated import of their own store.
 */

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Identify ourselves honestly on every outbound store request.
 *
 * Without a User-Agent, Node sends none, and the bot protection in front of
 * hosted storefronts (Shopify/Cloudflare in particular) answers `/products.json`
 * with a 429 on the very first request. Saying plainly who we are and linking a
 * contact page is both the thing that gets us served and the correct way to
 * behave: a shop owner reading their logs can see exactly what this is and who
 * to talk to. Never impersonate a browser here.
 */
export const SAFE_FETCH_USER_AGENT =
  "ArtisanalFuturesBot/1.0 (+https://artisanalfutures.org; product sync on behalf of the shop owner)";

const DEFAULT_HEADERS = {
  accept: "application/json, text/plain;q=0.9, */*;q=0.5",
  "user-agent": SAFE_FETCH_USER_AGENT,
} as const;

/** Statuses worth waiting out rather than failing on. */
const RETRYABLE_STATUSES = new Set([429, 503]);
const MAX_RETRIES = 3;
/**
 * Cap on how long we'll honour a `Retry-After` before giving up instead.
 *
 * Shopify's storefront throttle answers with `Retry-After: 60` and a
 * `local_rate_limited` body — a short, cooperative "come back in a minute".
 * Product syncing is background work (weekly, and hand-triggered at most once
 * per shop per 15 minutes), so a minute of patience costs nothing and is the
 * difference between a shop syncing and not. Two minutes leaves headroom above
 * the common 60s ask while still refusing an open-ended wait.
 */
const MAX_RETRY_DELAY_MS = 120_000;

export class SafeFetchError extends Error {
  /** HTTP status, when the failure was an HTTP response rather than a network error. */
  readonly status?: number;
  /** Raw `Retry-After` header, when the server sent one. */
  readonly retryAfter?: string | null;

  constructor(
    message: string,
    opts: { status?: number; retryAfter?: string | null } = {},
  ) {
    super(message);
    this.name = "SafeFetchError";
    this.status = opts.status;
    this.retryAfter = opts.retryAfter;
  }

  /** True when waiting and trying again is worth doing. */
  get isRetryable(): boolean {
    return this.status !== undefined && RETRYABLE_STATUSES.has(this.status);
  }
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** node:http gives a header as string | string[] | undefined; flatten it. */
function headerValue(raw: string | string[] | undefined): string | null {
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

/**
 * How long to wait before retrying a throttled request. Prefers the server's
 * own `Retry-After` (seconds, or an HTTP date), falling back to exponential
 * backoff. Returns null when the wait would be longer than we're willing to
 * hold the request open.
 */
export function retryDelayMs(
  retryAfter: string | null | undefined,
  attempt: number,
): number | null {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const ms = Number.isFinite(seconds)
      ? seconds * 1000
      : new Date(retryAfter).getTime() - Date.now();
    if (Number.isFinite(ms) && ms > 0) {
      return ms <= MAX_RETRY_DELAY_MS ? ms : null;
    }
  }
  // 1s, 2s, 4s — enough to clear a short throttle without stalling a sweep.
  return Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS);
}

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map((p) => Number(p));
  return (
    ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0
  );
}

function inCidr(ip: string, network: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(network) & mask);
}

function isPrivateIPv4(ip: string): boolean {
  return (
    inCidr(ip, "0.0.0.0", 8) || // "this" network
    inCidr(ip, "10.0.0.0", 8) || // private
    inCidr(ip, "100.64.0.0", 10) || // CGNAT
    inCidr(ip, "127.0.0.0", 8) || // loopback
    inCidr(ip, "169.254.0.0", 16) || // link-local (incl. cloud metadata)
    inCidr(ip, "172.16.0.0", 12) || // private
    inCidr(ip, "192.0.0.0", 24) || // IETF protocol assignments
    inCidr(ip, "192.0.2.0", 24) || // TEST-NET-1
    inCidr(ip, "192.168.0.0", 16) || // private
    inCidr(ip, "198.18.0.0", 15) || // benchmarking
    inCidr(ip, "198.51.100.0", 24) || // TEST-NET-2
    inCidr(ip, "203.0.113.0", 24) || // TEST-NET-3
    inCidr(ip, "224.0.0.0", 4) || // multicast
    inCidr(ip, "240.0.0.0", 4) // reserved / broadcast
  );
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded IPv4.
  const mapped = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(lower);
  if (mapped) return isPrivateIPv4(mapped[1]!);

  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  if (lower.startsWith("fe80") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
    return true; // link-local fe80::/10
  }
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7
  if (lower.startsWith("ff")) return true; // multicast
  return false;
}

function isBlockedAddress(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // unknown format → block
}

/** Validate scheme/credentials and return a normalized URL, or throw. */
export function assertPublicHttpUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SafeFetchError("Invalid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SafeFetchError("Only http(s) URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new SafeFetchError("URLs with embedded credentials are not allowed.");
  }
  // Only allow default ports (none, 80, 443) to avoid probing internal services.
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new SafeFetchError("Only standard web ports are allowed.");
  }
  return url;
}

/** Resolve a hostname and throw if any address is private/reserved. */
export async function assertHostResolvesPublic(hostname: string): Promise<void> {
  // `URL.hostname` keeps the brackets around IPv6 literals (e.g. "[::1]");
  // strip them before checking with `net.isIP`, or a bracketed private
  // literal would fall through to DNS resolution instead of being blocked.
  const literal =
    hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;

  if (net.isIP(literal)) {
    if (isBlockedAddress(literal)) {
      throw new SafeFetchError("Refusing to fetch a private/reserved address.");
    }
    return;
  }
  let records: { address: string }[];
  try {
    records = await dns.lookup(literal, { all: true });
  } catch {
    throw new SafeFetchError(`Could not resolve host "${hostname}".`);
  }
  if (records.length === 0) {
    throw new SafeFetchError(`Could not resolve host "${hostname}".`);
  }
  for (const record of records) {
    if (isBlockedAddress(record.address)) {
      throw new SafeFetchError(
        `Refusing to fetch "${hostname}" — it resolves to a private/reserved address.`,
      );
    }
  }
}

type SafeFetchOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  /**
   * If a request fails specifically because of a TLS certificate problem
   * (expired/self-signed/hostname mismatch), retry once with certificate
   * verification disabled. Off by default; the store importer opts in.
   */
  allowInsecureTLSFallback?: boolean;
  /**
   * Invoked with the cert error code when the insecure TLS fallback is used,
   * so callers can surface a "this store's certificate is invalid" notice.
   */
  onInsecureTLSFallback?: (certCode: string) => void;
};

// OpenSSL/Node error codes that mean "the server's certificate didn't verify"
// — as opposed to a connection failure, DNS error, etc.
const TLS_CERT_ERROR_CODES = new Set([
  "CERT_HAS_EXPIRED",
  "CERT_NOT_YET_VALID",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);

/** Return the TLS-cert error code for a fetch/connection failure, else null. */
function tlsCertErrorCode(err: unknown): string | null {
  // Global fetch wraps the real error in `cause`; node:https throws it directly.
  const cause = (err as { cause?: unknown })?.cause ?? err;
  const code = (cause as { code?: unknown })?.code;
  if (
    typeof code === "string" &&
    (TLS_CERT_ERROR_CODES.has(code) || code.includes("CERT"))
  ) {
    return code;
  }
  return null;
}

/** Primary transport: global `fetch` with full TLS verification. */
async function fetchSecureText(
  url: URL,
  timeoutMs: number,
  maxBytes: number,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "manual",
      headers: DEFAULT_HEADERS,
    });

    if (res.status >= 300 && res.status < 400) {
      console.error(
        `[safeFetch] ${url.href} redirected (HTTP ${res.status}) to "${
          res.headers.get("location") ?? "?"
        }" — refusing to follow.`,
      );
      throw new SafeFetchError(
        "Refusing to follow a redirect while fetching store data.",
      );
    }
    if (!res.ok) {
      // Read a snippet of the error body for diagnostics. WordPress/WooCommerce
      // returns a JSON error (e.g. {"code":"rest_no_route",...}) that tells us
      // exactly why the request failed, but it never reaches the client.
      let bodySnippet = "";
      try {
        bodySnippet = (await res.text()).slice(0, 500);
      } catch {
        // ignore — body may be unreadable
      }
      console.error(
        `[safeFetch] ${url.href} responded HTTP ${res.status}. Body: ${
          bodySnippet || "(empty)"
        }`,
      );
      throw new SafeFetchError(
        res.status === 429
          ? "The store is rate limiting us (HTTP 429). Try again in a few minutes."
          : `Store responded with HTTP ${res.status}.`,
        { status: res.status, retryAfter: res.headers.get("retry-after") },
      );
    }

    const contentLength = Number(res.headers.get("content-length") ?? "0");
    if (contentLength && contentLength > maxBytes) {
      throw new SafeFetchError("Store response is too large to import.");
    }

    if (!res.body) return await res.text();

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new SafeFetchError("Store response is too large to import.");
        }
        chunks.push(value);
      }
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
  } catch (err) {
    if (err instanceof SafeFetchError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new SafeFetchError("Timed out fetching store data.");
    }
    // Re-throw raw network/TLS errors so the caller can inspect the cause
    // (e.g. to decide whether to retry without certificate verification).
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fallback transport: node:http(s) with `rejectUnauthorized: false`. Only used
 * after the secure transport fails with a certificate error. Applies the same
 * redirect refusal, status check, and size/time caps as the secure path.
 */
function fetchInsecureText(
  url: URL,
  timeoutMs: number,
  maxBytes: number,
): Promise<string> {
  const lib = url.protocol === "http:" ? http : https;
  return new Promise<string>((resolve, reject) => {
    const req = lib.request(
      url,
      {
        method: "GET",
        rejectUnauthorized: false,
        timeout: timeoutMs,
        headers: DEFAULT_HEADERS,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.destroy();
          console.error(
            `[safeFetch] (insecure) ${url.href} redirected (HTTP ${status}) to "${
              res.headers.location ?? "?"
            }" — refusing to follow.`,
          );
          reject(
            new SafeFetchError(
              "Refusing to follow a redirect while fetching store data.",
            ),
          );
          return;
        }

        const chunks: Buffer[] = [];
        let total = 0;
        res.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > maxBytes) {
            req.destroy();
            reject(new SafeFetchError("Store response is too large to import."));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf-8");
          if (status < 200 || status >= 300) {
            console.error(
              `[safeFetch] (insecure) ${url.href} responded HTTP ${status}. Body: ${
                body.slice(0, 500) || "(empty)"
              }`,
            );
            reject(
              new SafeFetchError(
                status === 429
                  ? "The store is rate limiting us (HTTP 429). Try again in a few minutes."
                  : `Store responded with HTTP ${status}.`,
                { status, retryAfter: headerValue(res.headers["retry-after"]) },
              ),
            );
            return;
          }
          resolve(body);
        });
      },
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new SafeFetchError("Timed out fetching store data."));
    });
    req.on("error", (err) => {
      console.error(`[safeFetch] (insecure) ${url.href} failed:`, err);
      reject(new SafeFetchError("Failed to fetch store data."));
    });
    req.end();
  });
}

/**
 * Fetch a URL as text with SSRF protections, a timeout, and a size cap.
 * Refuses redirects and non-2xx responses. Optionally retries without TLS
 * certificate verification when (and only when) the failure is a cert error.
 */
export async function safeFetchText(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<string> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    allowInsecureTLSFallback = false,
    onInsecureTLSFallback,
  } = options;

  const url = assertPublicHttpUrl(rawUrl);
  await assertHostResolvesPublic(url.hostname);

  // Wait out transient throttling (429/503) rather than failing the whole
  // import. Honours the store's own `Retry-After` when it sends one; a wait
  // longer than we're prepared to hold open is treated as a hard failure so a
  // sweep can move on to the next shop.
  for (let attempt = 0; ; attempt++) {
    try {
      return await attemptFetch();
    } catch (err) {
      const retryable =
        err instanceof SafeFetchError && err.isRetryable && attempt < MAX_RETRIES;
      if (!retryable) throw err;

      const delay = retryDelayMs(err.retryAfter, attempt);
      if (delay === null) {
        console.warn(
          `[safeFetch] ${url.href} asked us to wait ${err.retryAfter}s — longer than the ${
            MAX_RETRY_DELAY_MS / 1000
          }s we're willing to hold a request open; giving up.`,
        );
        throw new SafeFetchError(
          `The store asked us to wait ${err.retryAfter} seconds before trying again — longer than we hold a request open. The next scheduled sync should pick it up.`,
          { status: err.status, retryAfter: err.retryAfter },
        );
      }
      console.warn(
        `[safeFetch] ${url.href} returned HTTP ${err.status}; retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}).`,
      );
      await sleep(delay);
    }
  }

  async function attemptFetch(): Promise<string> {
  try {
    return await fetchSecureText(url, timeoutMs, maxBytes);
  } catch (err) {
    if (err instanceof SafeFetchError) throw err;

    const certCode = tlsCertErrorCode(err);
    if (certCode) {
      if (allowInsecureTLSFallback && url.protocol === "https:") {
        console.warn(
          `[safeFetch] ${url.href} has a TLS certificate problem (${certCode}); retrying with certificate verification disabled.`,
        );
        onInsecureTLSFallback?.(certCode);
        return await fetchInsecureText(url, timeoutMs, maxBytes);
      }
      console.error(`[safeFetch] ${url.href} TLS certificate problem: ${certCode}`);
      throw new SafeFetchError(
        `The store's SSL certificate is invalid (${certCode}).`,
      );
    }

    // Other network-level failures (DNS, ECONNREFUSED, etc.).
    console.error(`[safeFetch] ${url.href} failed:`, err);
    throw new SafeFetchError("Failed to fetch store data.");
  }
  }
}
