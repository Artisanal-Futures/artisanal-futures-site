import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

import { env } from "~/env";
import { sendPlatformInviteEmail } from "~/lib/email/templates";

import { adminOnlyProcedure, createTRPCRouter } from "../trpc";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function generateInviteCode(): string {
  return createId().slice(0, 8).toUpperCase();
}

export const inviteRouter = createTRPCRouter({
  createInvite: adminOnlyProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["ARTISAN", "GUEST"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const baseUrl = env.BETTER_AUTH_URL ?? "https://localhost:3000";
      const path = input.role === "ARTISAN" ? "/join/artisan" : "/join/guest";

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
      });

      return invite;
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
});
