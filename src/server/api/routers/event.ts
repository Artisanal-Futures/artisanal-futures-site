import { z } from "zod";

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
    return ctx.db.event.findMany({
      include: { shop: true },
    });
  }),
  get: adminArtisanProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.event.findUnique({
      where: { id: input },
      include: { shop: true },
    });
  }),

  create: adminArtisanProcedure
    .input(eventSchema)
    .mutation(async ({ ctx, input }) => {
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
      await ctx.db.event.deleteMany({
        where: { id: { in: ids } },
      });
      return {
        data: null,
        message: "Events deleted successfully",
      };
    }),
});
