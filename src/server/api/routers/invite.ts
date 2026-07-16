import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "generated/prisma";
import { z } from "zod";

import { env } from "~/env";
import { sendPlatformInviteEmail } from "~/lib/email/templates";

import { adminOnlyProcedure, createTRPCRouter } from "../trpc";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function generateInviteCode(): string {
  return createId().slice(0, 8).toUpperCase();
}

async function assertShopAttachable(
  db: PrismaClient,
  shopId: string,
  opts: { excludeInviteId?: string } = {},
) {
  const shop = await db.shop.findUnique({ where: { id: shopId } });
  if (!shop) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Shop not found" });
  }

  const pendingInvite = await db.platformInvite.findFirst({
    where: {
      shopId,
      used: false,
      expiresAt: { gt: new Date() },
      ...(opts.excludeInviteId ? { id: { not: opts.excludeInviteId } } : {}),
    },
  });
  if (pendingInvite) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This shop is already attached to another pending invite",
    });
  }

  return shop;
}

export const inviteRouter = createTRPCRouter({
  createInvite: adminOnlyProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["ARTISAN", "GUEST", "ADMIN"]),
        shopId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.shopId && input.role !== "ARTISAN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Shops can only be attached to Artisan invites",
        });
      }
      const shop = input.shopId
        ? await assertShopAttachable(ctx.db, input.shopId)
        : null;

      const baseUrl = env.BETTER_AUTH_URL ?? "https://localhost:3000";
      const rolePaths: Record<string, string> = {
        ARTISAN: "/auth/join/artisan",
        GUEST: "/auth/join/guest",
        ADMIN: "/auth/join/admin",
      };
      const path = rolePaths[input.role] ?? "/auth/join/guest";

      let code: string;
      let invite: Awaited<ReturnType<typeof ctx.db.platformInvite.create>>;
      let attempts = 0;
      const maxAttempts = 5;

      while (true) {
        code = generateInviteCode();
        const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
        try {
          invite = await ctx.db.platformInvite.create({
            data: {
              email: input.email,
              code,
              role: input.role,
              expiresAt,
              createdBy: ctx.session.user.id,
              shopId: input.shopId,
            },
          });
          break;
        } catch (err) {
          const isUniqueViolation =
            err &&
            typeof err === "object" &&
            "code" in err &&
            (err as { code?: string }).code === "P2002";
          if (isUniqueViolation && attempts < maxAttempts) {
            attempts++;
            continue;
          }
          throw err;
        }
      }

      const inviteUrl = `${baseUrl}${path}?code=${encodeURIComponent(code)}`;
      await sendPlatformInviteEmail({
        to: input.email,
        role: input.role,
        inviteUrl,
        inviteCode: code,
        shopName: shop?.name,
      });

      return invite;
    }),

  updateInviteShop: adminOnlyProcedure
    .input(z.object({ inviteId: z.string(), shopId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.platformInvite.findUnique({
        where: { id: input.inviteId },
      });
      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }
      if (invite.used || invite.expiresAt <= new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only pending invites can have a shop attached or detached",
        });
      }
      if (input.shopId !== null) {
        if (invite.role !== "ARTISAN") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Shops can only be attached to Artisan invites",
          });
        }
        await assertShopAttachable(ctx.db, input.shopId, {
          excludeInviteId: input.inviteId,
        });
      }

      await ctx.db.platformInvite.update({
        where: { id: input.inviteId },
        data: { shopId: input.shopId },
      });

      return {
        message: input.shopId ? "Shop attached" : "Shop detached",
      };
    }),

  deleteInvite: adminOnlyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.platformInvite.delete({ where: { id: input.id } });
      return { message: "Invite deleted successfully" };
    }),

  deleteManyInvites: adminOnlyProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input: ids }) => {
      await ctx.db.platformInvite.deleteMany({ where: { id: { in: ids } } });
      return { message: `${ids.length} invite(s) deleted successfully` };
    }),

  listInvites: adminOnlyProcedure
    .input(
      z
        .object({
          status: z.enum(["pending", "used", "expired"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const invites = await ctx.db.platformInvite.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          shop: {
            select: { id: true, name: true },
          },
        },
      });

      let filtered = invites;
      if (input?.status) {
        if (input.status === "pending") {
          filtered = invites.filter((i) => !i.used && i.expiresAt > now);
        } else if (input.status === "used") {
          filtered = invites.filter((i) => i.used);
        } else {
          filtered = invites.filter((i) => !i.used && i.expiresAt <= now);
        }
      }

      return filtered.map((i) => ({
        ...i,
        status: i.used ? "used" : i.expiresAt <= now ? "expired" : "pending",
      }));
    }),

  listAttachableShops: adminOnlyProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const shops = await ctx.db.shop.findMany({
      select: {
        id: true,
        name: true,
        ownerName: true,
        owner: { select: { name: true, email: true } },
        invites: {
          where: { used: false, expiresAt: { gt: now } },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return shops.map((s) => ({
      id: s.id,
      name: s.name,
      ownerName: s.ownerName,
      ownerLabel: s.owner.name ?? s.owner.email ?? "",
      pendingInviteId: s.invites[0]?.id ?? null,
    }));
  }),
});
