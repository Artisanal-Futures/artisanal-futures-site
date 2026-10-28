import { createHash, randomBytes } from "node:crypto";

/**
 * Pure token helpers (no database or env access) so they can be unit-tested
 * under plain `node --test`. Auth itself lives in `api-tokens.ts`.
 *
 * Owner-issued, read-only API tokens for the Shop Profile API (`/api/v1/...`).
 * A token is `afk_` + 43 base64url chars (256 bits of entropy). Only its
 * sha256 hex digest is stored (`ShopApiToken.tokenHash`) — hashed rather than
 * encrypted because auth looks the row up with `where: { tokenHash }`. With
 * 256 random bits a plain fast hash is sufficient; there is nothing to
 * brute-force.
 */

export const API_TOKEN_PREFIX = "afk_";

export const API_TOKEN_SCOPES = ["profile:read"] as const;
export type ApiTokenScope = (typeof API_TOKEN_SCOPES)[number];

/** Most active (non-revoked) keys one shop can hold at a time. */
export const MAX_ACTIVE_TOKENS_PER_SHOP = 10;

const TOKEN_PATTERN = /^afk_[A-Za-z0-9_-]{43}$/;

export function hashApiToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Mint a new token. The raw `token` must be shown to the owner once and never
 * persisted; store only `tokenHash` and `prefix`.
 */
export function generateApiToken(): {
  token: string;
  tokenHash: string;
  prefix: string;
} {
  const token = `${API_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  return {
    token,
    tokenHash: hashApiToken(token),
    prefix: token.slice(0, 12),
  };
}

/**
 * Extract the raw token from an `Authorization: Bearer afk_...` header.
 * Returns null for anything that isn't well-formed, so malformed input never
 * reaches the database.
 */
export function parseBearer(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(authHeader);
  const token = match?.[1];
  if (!token?.startsWith(API_TOKEN_PREFIX)) return null;
  return TOKEN_PATTERN.test(token) ? token : null;
}
