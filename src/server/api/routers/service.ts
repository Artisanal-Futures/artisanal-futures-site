/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  createTRPCRouter,
  elevatedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";

import { serviceSchema } from "~/lib/validators/services"; 

export const serviceRouter = createTRPCRouter({
  updateTags: elevatedProcedure
    .input(
      z.object({
        serviceIds: z.array(z.string()),
        tagType: z.enum([
          "attributeTags",
          "aiGeneratedTags",
          "tags",
        ]),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { serviceIds, tagType, tags } = input;

      const updatedServices = await Promise.all(
        serviceIds.map(async (id) => {
          return ctx.db.service.update({
            where: { id },
            data: {
              [tagType]: tags,
            },
          });
        }),
      );

      return {
        data: updatedServices,
        message: `${updatedServices.length} services updated successfully`,
      };
    }),

  getAll: elevatedProcedure.query(async ({ ctx }) => {
    const services = await ctx.db.service.findMany({
      include: { shop: true },
      orderBy: {
        createdAt: "desc",
      },
    });
    const servicesWithFullUrls = services.map((service) => ({
      ...service,
      imageUrl:
        service.imageUrl && !service.imageUrl.startsWith("http")
          ? `https://storage.artisanalfutures.org/services/${service.imageUrl}` 
          : service.imageUrl,
    }));

    if (ctx.session.user.role !== "ADMIN") {
      return servicesWithFullUrls.filter(
        (service) => service.shop?.ownerId === ctx.session.user.id,
      );
    }

    return servicesWithFullUrls;
  }),

  getAllValid: publicProcedure
    .input(
      z
        .object({
          page: z.number().default(1),
          limit: z.number().default(20),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const [services, totalCount] = await Promise.all([
        ctx.db.service.findMany({
          where: { isPublic: true }, 
          include: { shop: true },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        ctx.db.service.count({ where: { isPublic: true } }),
      ]);

      const servicesWithFullUrls = services.map((service) => ({
        ...service,
        imageUrl:
          service.imageUrl && !service.imageUrl.startsWith("http")
            ? `https://storage.artisanalfutures.org/services/${service.imageUrl}`
            : service.imageUrl,
      }));

      return {
        services: servicesWithFullUrls,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const service = await ctx.db.service.findUnique({
      where: { id: input },
      include: { shop: true },
    });
    return service;
  }),

  getByShopId: publicProcedure
    .input(
      z.object({
        shopId: z.string(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { shopId, page, limit } = input;
      const skip = (page - 1) * limit;

      const [services, totalCount] = await Promise.all([
        ctx.db.service.findMany({
          where: { shopId },
          include: { shop: true },
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
        }),
        ctx.db.service.count({
          where: { shopId },
        }),
      ]);

      const servicesWithFullUrls = services.map((service) => ({
        ...service,
        imageUrl:
          service.imageUrl && !service.imageUrl.startsWith("http")
            ? `https://storage.artisanalfutures.org/services/${service.imageUrl}`
            : service.imageUrl,
      }));

      return {
        services: servicesWithFullUrls,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  create: elevatedProcedure
    .input(serviceSchema)
    .mutation(async ({ ctx, input }) => {
      const service = await ctx.db.service.create({
        data: {
          ...input,
        },
      });
      return {
        data: service,
        message: "Service created successfully",
      };
    }),

  update: elevatedProcedure
    .input(serviceSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const service = await ctx.db.service.update({
        where: { id },
        data,
      });
      return {
        data: service,
        message: "Service updated successfully",
      };
    }),

  delete: elevatedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // CHANGED: Deleting a 'service'
      const service = await ctx.db.service.delete({
        where: { id: input },
      });
      return {
        data: service,
        message: "Service deleted successfully",
      };
    }),

  importServices: publicProcedure
    .input(z.array(serviceSchema))
    .mutation(async ({ ctx, input }) => {
      const services = await Promise.all(
        input.map(async (service) => {
          const existingService = await ctx.db.service.findFirst({
            where: {
              name: service.name,
              shopId: service.shopId,
            },
          });

          if (existingService) {
            return ctx.db.service.update({
              where: { id: existingService.id },
              data: service,
            });
          }

          return ctx.db.service.create({
            data: service,
          });
        }),
      );

      return {
        data: services,
        message: "Services imported successfully",
      };
    }),
});