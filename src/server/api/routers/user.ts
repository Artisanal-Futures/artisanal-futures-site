import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Role } from "generated/prisma";
import { updateAccountSchema } from "~/lib/validators/account";
import {
  adminArtisanProcedure,
  adminOnlyProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { auth } from "~/server/better-auth";

const roleEnum = z.enum([
  "USER",
  "ADMIN",
  "ARTISAN",
  "DRIVER",
  "GUEST",
  "MANAGER",
]);

export const userRouter = createTRPCRouter({
  listUsers: adminOnlyProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            shops: true,
            posts: true,
            forumComments: true,
            guestSurveys: true,
          },
        },
        accounts: {
          select: { providerId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map(({ accounts, ...user }) => ({
      ...user,
      hasCredential: accounts.some((a) => a.providerId === "credential"),
      authProviders: accounts.map((a) => a.providerId),
    }));
  }),

  getUserDetail: adminOnlyProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = input;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          accounts: { select: { providerId: true } },
          shops: {
            select: {
              id: true,
              name: true,
              _count: {
                select: { products: true, services: true },
              },
            },
          },
          _count: {
            select: {
              posts: true,
              forumComments: true,
              guestSurveys: true,
              upcycleResults: true,
              websiteProvision: true,
              createdSubreddits: true,
            },
          },
        },
      });

      if (!user) return null;

      const artisanSurveys = await ctx.db.artisanSurvey.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          businessName: true,
          createdAt: true,
        },
      });

      const { accounts, ...rest } = user;
      return {
        ...rest,
        hasCredential: accounts.some((a) => a.providerId === "credential"),
        authProviders: accounts.map((a) => a.providerId),
        artisanSurveys,
      };
    }),

  setUserRole: adminOnlyProcedure
    .input(z.object({ userId: z.string(), role: roleEnum }))
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input;

      if (userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot change your own role here.",
        });
      }

      const target = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { role: true, name: true, email: true },
      });

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      if (target.role === "ADMIN" && role !== "ADMIN") {
        const adminCount = await ctx.db.user.count({
          where: { role: "ADMIN" },
        });
        if (adminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot demote the last admin. Promote another user to ADMIN first.",
          });
        }
      }

      const updated = await ctx.db.user.update({
        where: { id: userId },
        data: { role: role as Role },
        select: { name: true, email: true, role: true },
      });

      return {
        message: `${updated.name ?? updated.email} is now ${updated.role}.`,
      };
    }),

  sendPasswordReset: adminOnlyProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          email: true,
          name: true,
          accounts: { select: { providerId: true } },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      if (!user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This user has no email address on file.",
        });
      }

      const hasCredential = user.accounts.some(
        (a) => a.providerId === "credential",
      );

      if (!hasCredential) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This user signed in with a social provider and has no password to reset.",
        });
      }

      await auth.api.requestPasswordReset({
        body: { email: user.email },
      });

      return {
        message: `Password reset email sent to ${user.email}.`,
      };
    }),

  getAll: adminArtisanProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany();

    if (ctx.session.user.role !== "ADMIN") {
      return users.filter((user) => user.id === ctx.session.user.id);
    }

    return users;
  }),

  get: adminOnlyProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          accounts: true,
          sessions: true,
          posts: true,
        },
      });

      return user;
    }),

  delete: adminOnlyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.delete({
        where: { id: input.id },
      });

      return {
        data: user,
        message: `User with id '${input.id}' was deleted`,
      };
    }),

  getForumProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const user = await ctx.db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          image: true,
          title: true,
        },
      });

      return user;
    }),

  editForumProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1), title: z.string().nullish() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          title: input.title,
        },
      });

      return user;
    }),

  updateForumAvatar: protectedProcedure
    .input(z.object({ image: z.string().nullish() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          image: input.image,
        },
      });

      return user;
    }),

  getForumMentionList: protectedProcedure
    .input(z.object({}).nullable())
    .query(({ ctx }) => {
      const users = ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return users;
    }),

  getForumEmojiList: protectedProcedure
    .input(z.object({}).nullable())
    .query(async ({}) => {
      const gemoji = (await import("gemoji")).gemoji;
      return gemoji;
    }),

  update: protectedProcedure
    .input(updateAccountSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if username is already taken by another user
      const existingUser = await ctx.db.user.findFirst({
        where: {
          name: input.username,
          NOT: {
            id: ctx.session.user.id,
          },
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username is already taken",
        });
      }

      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          username: input.username,
          image: input.image ?? null,
        },
      });

      return {
        data: user,
        message: "Account updated successfully",
      };
    }),
});
