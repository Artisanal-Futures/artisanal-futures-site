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

/**
 * Sentinel account that inherits the forum content (posts + comments) of
 * deleted users so threads stay readable. Looked up / created by this exact
 * email — never hand it out to a real person.
 */
const DELETED_USER_EMAIL = "deleted-user@artisanalfutures.org";
const DELETED_USER_NAME = "Deleted User";

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
                select: { products: true, services: true, events: true },
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

  /**
   * Hybrid delete: hard-deletes the user's commerce and system data, but
   * PRESERVES their forum contributions by reassigning posts and comments to
   * the "Deleted User" sentinel account so threads stay readable.
   */
  delete: adminOnlyProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = input;

      if (userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account here.",
        });
      }

      const target = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      }

      if (target.email?.toLowerCase() === DELETED_USER_EMAIL) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "The 'Deleted User' placeholder account cannot be deleted. It owns the forum history of previously deleted users.",
        });
      }

      if (target.role === "ADMIN") {
        const adminCount = await ctx.db.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot delete the last admin. Promote another user to ADMIN first.",
          });
        }
      }

      // Find-or-create the sentinel account that will inherit forum content.
      let sentinel = await ctx.db.user.findUnique({
        where: { email: DELETED_USER_EMAIL },
        select: { id: true },
      });

      sentinel ??= await ctx.db.user.create({
        data: {
          email: DELETED_USER_EMAIL,
          name: DELETED_USER_NAME,
          role: "GUEST",
          emailVerified: true,
        },
        select: { id: true },
      });

      const sentinelId = sentinel.id;

      // Event.shopId is RESTRICT, so events must go before their shops.
      const ownedShops = await ctx.db.shop.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const shopIds = ownedShops.map((shop) => shop.id);

      const summary = await ctx.db.$transaction(async (tx) => {
        // a. Reassign forum content to the sentinel so threads survive.
        const posts = await tx.post.updateMany({
          where: { authorId: userId },
          data: { authorId: sentinelId },
        });
        const comments = await tx.forumComment.updateMany({
          where: { authorId: userId },
          data: { authorId: sentinelId },
        });

        // b. Their own forum actions die with them. Votes/comments other users
        // left on the reassigned posts are untouched.
        const commentVotes = await tx.commentVote.deleteMany({
          where: { userId },
        });
        const votes = await tx.vote.deleteMany({ where: { userId } });
        const subscriptions = await tx.subscription.deleteMany({
          where: { userId },
        });

        // c. Events of the user's shops (RESTRICT on Shop).
        const events =
          shopIds.length > 0
            ? await tx.event.deleteMany({ where: { shopId: { in: shopIds } } })
            : { count: 0 };

        // d. Shops — cascades products, services, address, shop provision.
        const shops = await tx.shop.deleteMany({ where: { ownerId: userId } });

        // e. RESTRICT-ing personal data.
        const notifications = await tx.notification.deleteMany({
          where: { userId },
        });
        const upcycleResults = await tx.upcycleResult.deleteMany({
          where: { userId },
        });
        // TrainingImage cascades from TrainingDataSet.
        const trainingDataSets = await tx.trainingDataSet.deleteMany({
          where: { userId },
        });

        // f. Finally the user — sessions, accounts, messaging profile,
        // upcy-agent tables and user-scoped website provisions cascade.
        await tx.user.delete({ where: { id: userId } });

        return {
          postsReassigned: posts.count,
          commentsReassigned: comments.count,
          commentVotesDeleted: commentVotes.count,
          votesDeleted: votes.count,
          subscriptionsDeleted: subscriptions.count,
          eventsDeleted: events.count,
          shopsDeleted: shops.count,
          notificationsDeleted: notifications.count,
          upcycleResultsDeleted: upcycleResults.count,
          trainingDataSetsDeleted: trainingDataSets.count,
        };
      });

      const label = target.name ?? target.email ?? userId;
      const preserved =
        summary.postsReassigned > 0 || summary.commentsReassigned > 0
          ? ` ${summary.postsReassigned} post(s) and ${summary.commentsReassigned} comment(s) were reassigned to '${DELETED_USER_NAME}'.`
          : "";

      return {
        ...summary,
        message: `${label} was deleted.${preserved}`,
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
