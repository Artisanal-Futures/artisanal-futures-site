import type { ApiTokenScope } from "./api-tokens-core";
import { db } from "~/server/db";

import { hashApiToken, parseBearer } from "./api-tokens-core";

export {
  API_TOKEN_PREFIX,
  API_TOKEN_SCOPES,
  MAX_ACTIVE_TOKENS_PER_SHOP,
  generateApiToken,
  hashApiToken,
  parseBearer,
} from "./api-tokens-core";
export type { ApiTokenScope } from "./api-tokens-core";

/**
 * Bearer-token authentication for the Shop Profile API. Unlike SimplePress
 * there is no host binding (AF is a single domain): the token alone
 * identifies the shop. Every failure returns the same bare 401 so a caller
 * can't tell a revoked token from an unknown one or a hidden shop.
 */

/** Only touch lastUsedAt this often, so reads don't turn into writes. */
const LAST_USED_REFRESH_MS = 5 * 60 * 1000;

export type VerifyShopApiTokenResult =
  | { ok: true; tokenId: string; shopId: string }
  | { ok: false; status: 401 | 403 };

/**
 * Authenticate an API request: bearer token → active token on a public shop →
 * scope granted. 401 for every identity failure (uniform, no detail); 403 only
 * when the token is valid but lacks the scope.
 */
export async function verifyShopApiToken(args: {
  authorization: string | null;
  scope: ApiTokenScope;
}): Promise<VerifyShopApiTokenResult> {
  const raw = parseBearer(args.authorization);
  if (!raw) return { ok: false, status: 401 };

  const token = await db.shopApiToken.findUnique({
    where: { tokenHash: hashApiToken(raw) },
    select: {
      id: true,
      shopId: true,
      scopes: true,
      revokedAt: true,
      lastUsedAt: true,
      shop: { select: { isPublic: true } },
    },
  });

  if (!token || token.revokedAt || !token.shop.isPublic) {
    return { ok: false, status: 401 };
  }

  if (!token.scopes.includes(args.scope)) return { ok: false, status: 403 };

  const now = Date.now();
  if (
    !token.lastUsedAt ||
    now - token.lastUsedAt.getTime() > LAST_USED_REFRESH_MS
  ) {
    // Best-effort bookkeeping: a failed write must never fail the read.
    void db.shopApiToken
      .update({ where: { id: token.id }, data: { lastUsedAt: new Date(now) } })
      .catch(() => {
        /* ignore */
      });
  }

  return { ok: true, tokenId: token.id, shopId: token.shopId };
}
