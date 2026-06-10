import dns from "node:dns/promises";
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
 */

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export class SafeFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafeFetchError";
  }
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
  if (net.isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new SafeFetchError("Refusing to fetch a private/reserved address.");
    }
    return;
  }
  let records: { address: string }[];
  try {
    records = await dns.lookup(hostname, { all: true });
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
};

/**
 * Fetch a URL as text with SSRF protections, a timeout, and a size cap.
 * Refuses redirects and non-2xx responses.
 */
export async function safeFetchText(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<string> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = DEFAULT_MAX_BYTES } =
    options;

  const url = assertPublicHttpUrl(rawUrl);
  await assertHostResolvesPublic(url.hostname);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "manual",
      headers: { accept: "application/json, text/plain;q=0.9, */*;q=0.5" },
    });

    if (res.status >= 300 && res.status < 400) {
      throw new SafeFetchError(
        "Refusing to follow a redirect while fetching store data.",
      );
    }
    if (!res.ok) {
      throw new SafeFetchError(`Store responded with HTTP ${res.status}.`);
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
    throw new SafeFetchError("Failed to fetch store data.");
  } finally {
    clearTimeout(timer);
  }
}
