import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { checkUserShopPermissions } from "~/lib/check-user-permissions";
import { eventSchema, eventUpdateSchema } from "~/lib/validators/event";
import {
  adminArtisanProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const eventRouter = createTRPCRouter({
  getHomepageEvents: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    return ctx.db.event.findMany({
      where: {
        OR: [
          { persist: true },
          { endDate: { gte: now } },
          { endDate: null, startDate: { gte: startOfToday } },
        ],
      },
      orderBy: { startDate: "asc" },
      include: { shop: true },
    });
  }),

  getUpcomingEvents: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.event.findMany({
      where: {
        startDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
      include: { shop: true },
    });
  }),
  getAll: adminArtisanProcedure.query(async ({ ctx }) => {
    // Admins see every event; artisans only see events for shops they own.
    return ctx.db.event.findMany({
      where:
        ctx.session.user.role === "ADMIN"
          ? undefined
          : { shop: { ownerId: ctx.session.user.id } },
      include: { shop: true },
    });
  }),
  get: adminArtisanProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const event = await ctx.db.event.findUnique({
      where: { id: input },
      include: { shop: true },
    });

    if (!event) {
      return null;
    }

    // Artisans may only read events for their own shops; admins may read any.
    const canManage = await checkUserShopPermissions(ctx.session, event.shopId);
    if (!canManage) {
      return null;
    }

    return event;
  }),

  create: adminArtisanProcedure
    .input(eventSchema)
    .mutation(async ({ ctx, input }) => {
      const canManage = await checkUserShopPermissions(
        ctx.session,
        input.shopId,
      );
      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only create events for your own shop.",
        });
      }
      const event = await ctx.db.event.create({
        data: {
          title: input.title,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
          location: input.location,
          imageUrl: input.imageUrl,
          callToActionLink: input.callToActionLink,
          shopId: input.shopId,
          persist: input.persist,
        },
      });
      return {
        data: event,
        message: "Event created successfully",
      };
    }),

  update: adminArtisanProcedure
    .input(eventUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.event.findUnique({
        where: { id: input.id },
        select: { shopId: true },
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found.",
        });
      }
      // Must own the event's current shop AND the shop it's being assigned to.
      const canManageExisting = await checkUserShopPermissions(
        ctx.session,
        existing.shopId,
      );
      const canManageTarget = await checkUserShopPermissions(
        ctx.session,
        input.shopId,
      );
      if (!canManageExisting || !canManageTarget) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only manage events for your own shop.",
        });
      }
      const event = await ctx.db.event.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
          location: input.location,
          imageUrl: input.imageUrl,
          callToActionLink: input.callToActionLink,
          shopId: input.shopId,
          persist: input.persist,
        },
      });
      return {
        data: event,
        message: "Event updated successfully",
      };
    }),

  delete: adminArtisanProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: id }) => {
      const existing = await ctx.db.event.findUnique({
        where: { id },
        select: { shopId: true },
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found.",
        });
      }
      const canManage = await checkUserShopPermissions(
        ctx.session,
        existing.shopId,
      );
      if (!canManage) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete events for your own shop.",
        });
      }
      await ctx.db.event.delete({
        where: { id },
      });
      return {
        data: null,
        message: "Event deleted successfully",
      };
    }),

  deleteMany: adminArtisanProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input: ids }) => {
      // Admins may delete any events; artisans only their own shops' events.
      if (ctx.session.user.role !== "ADMIN") {
        const events = await ctx.db.event.findMany({
          where: { id: { in: ids } },
          select: { shop: { select: { ownerId: true } } },
        });
        const ownsAll =
          events.length === ids.length &&
          events.every((e) => e.shop?.ownerId === ctx.session.user.id);
        if (!ownsAll) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only delete events for your own shop.",
          });
        }
      }
      await ctx.db.event.deleteMany({
        where: { id: { in: ids } },
      });
      return {
        data: null,
        message: "Events deleted successfully",
      };
    }),
});
