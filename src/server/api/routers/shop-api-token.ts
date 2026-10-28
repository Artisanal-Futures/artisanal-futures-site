import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { absoluteUrl } from "~/lib/seo/site-url";
import { artisanProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
  API_TOKEN_SCOPES,
  generateApiToken,
  MAX_ACTIVE_TOKENS_PER_SHOP,
} from "~/server/lib/api-tokens";

/**
 * Columns the owner UI may see. Deliberately excludes `tokenHash` — the hash
 * is the lookup key for authentication and must never leave the server.
 */
const API_TOKEN_LIST_SELECT = {
  id: true,
  name: true,
  prefix: true,
  scopes: true,
  createdAt: true,
  lastUsedAt: true,
  revokedAt: true,
} as const;

type Ctx = { shopsAvailable: { id: string }[] };

function assertShopAccess(ctx: Ctx, shopId: string) {
  if (!ctx.shopsAvailable.some((shop) => shop.id === shopId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "That shop does not belong to you.",
    });
  }
}

/**
 * Owner-issued keys for the read-only Shop Profile API (`/api/v1/...`).
 *
 * `artisanProcedure` supplies `ctx.shopsAvailable` (the caller's shops, or all
 * of them for admins); every procedure checks the target shop against it. A
 * key hands the shop's profile and catalog to an outside app, so it is a
 * decision for the shop's owner or an admin.
 */
export const shopApiTokenRouter = createTRPCRouter({
  list: artisanProcedure
    .input(z.object({ shopId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      assertShopAccess(ctx, input.shopId);

      const tokens = await ctx.db.shopApiToken.findMany({
        where: { shopId: input.shopId },
        select: API_TOKEN_LIST_SELECT,
        orderBy: { createdAt: "desc" },
      });
      // Active keys first, revoked ones after; newest first within each group.
      return [
        ...tokens.filter((t) => !t.revokedAt),
        ...tokens.filter((t) => t.revokedAt),
      ];
    }),

  create: artisanProcedure
    .input(
      z.object({
        shopId: z.string().min(1),
        name: z.string().trim().min(1).max(60),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertShopAccess(ctx, input.shopId);

      const activeCount = await ctx.db.shopApiToken.count({
        where: { shopId: input.shopId, revokedAt: null },
      });
      if (activeCount >= MAX_ACTIVE_TOKENS_PER_SHOP) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `You can have up to ${MAX_ACTIVE_TOKENS_PER_SHOP} active keys. Revoke one you no longer use first.`,
        });
      }

      const { token, tokenHash, prefix } = generateApiToken();
      const row = await ctx.db.shopApiToken.create({
        data: {
          shopId: input.shopId,
          name: input.name,
          tokenHash,
          prefix,
          scopes: [...API_TOKEN_SCOPES],
          createdById: ctx.session.user.id,
        },
        select: { id: true },
      });

      // The raw token exists only in this response — it is never stored.
      return {
        id: row.id,
        name: input.name,
        prefix,
        token,
        endpointUrl: absoluteUrl("/api/v1/shop-profile"),
      };
    }),

  revoke: artisanProcedure
    .input(z.object({ shopId: z.string().min(1), id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      assertShopAccess(ctx, input.shopId);

      // Scoped to this shop, and only touches still-active rows, so revoking
      // twice (or another shop's id) is a harmless no-op.
      await ctx.db.shopApiToken.updateMany({
        where: { id: input.id, shopId: input.shopId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { success: true };
    }),
});
