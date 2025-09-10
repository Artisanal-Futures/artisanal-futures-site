/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  adminProcedure,
  createTRPCRouter,
  elevatedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";

import { type Prisma, type PrismaClient } from "@prisma/client";

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  priceInCents: z.coerce.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  durationInMinutes: z.coerce.number().optional().nullable(),
  locationType: z.string().optional().nullable(),
  tags: z.array(z.string()),
  attributeTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  shopId: z.string().min(1, "Shop is required."),
  isPublic: z.boolean().default(false),
  categoryIds: z.array(z.string()).optional(),
});

type ServiceWithImageUrl<T> = T & {
  imageUrl?: string | null;
};

// Generic addFullImageUrl that preserves the original type structure
const addFullImageUrl = <T extends { imageUrl?: string | null }>(
  service: T | null,
): T | null => {
  if (!service) return null;
  const storageBaseUrl = "https://storage.artisanalfutures.org/services";
  if (service.imageUrl && !service.imageUrl.startsWith("http")) {
    return { ...service, imageUrl: `${storageBaseUrl}/${service.imageUrl}` };
  }
  return service;
};

const getCategoriesWithParents = async (
  db: PrismaClient,
  categoryIds: string[] | undefined,
): Promise<string[]> => {
  if (!categoryIds || categoryIds.length === 0) {
    return [];
  }

  const selectedCategories = await db.category.findMany({
    where: { id: { in: categoryIds } },
    select: { parentId: true },
  });

  const parentIds = selectedCategories
    .map((cat) => cat.parentId)
    .filter((id): id is string => id !== null);

  return [...new Set([...categoryIds, ...parentIds])];
};

export const serviceRouter = createTRPCRouter({
  updateTags: elevatedProcedure
    .input(
      z.object({
        serviceIds: z.array(z.string()),
        tagType: z.enum(["attributeTags", "aiGeneratedTags", "tags"]),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { serviceIds, tagType, tags } = input;
      const updatedServices = await Promise.all(
        serviceIds.map(async (id) => {
          return ctx.db.service.update({
            where: { id },
            data: { [tagType]: tags },
          });
        }),
      );
      return {
        data: updatedServices.map(addFullImageUrl),
        message: `${updatedServices.length} services updated successfully`,
      };
    }),

  getAll: adminProcedure.query(async ({ ctx }) => {
    const services = await ctx.db.service.findMany({
      include: { shop: true, categories: true },
      orderBy: { createdAt: "desc" },
    });
    return services.map(addFullImageUrl);
  }),

  update: adminProcedure
    .input(serviceSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, categoryIds, ...serviceData } = input;

      const allCategoryIds = await getCategoriesWithParents(
        ctx.db,
        categoryIds,
      );

      const service = await ctx.db.service.update({
        where: { id },
        data: {
          ...serviceData,
          categories: {
            set: allCategoryIds.map((id) => ({ id })),
          },
        },
      });
      return {
        data: addFullImageUrl(service),
        message: "Service updated successfully",
      };
    }),

  create: adminProcedure
    .input(serviceSchema)
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, ...serviceData } = input;

      const allCategoryIds = await getCategoriesWithParents(
        ctx.db,
        categoryIds,
      );

      const service = await ctx.db.service.create({
        data: {
          ...serviceData,
          categories: {
            connect: allCategoryIds.map((id) => ({ id })),
          },
        },
      });
      return {
        data: addFullImageUrl(service),
        message: "Service created successfully",
      };
    }),

  delete: adminProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const service = await ctx.db.service.delete({
      where: { id: input },
    });
    return {
      data: addFullImageUrl(service),
      message: "Service deleted successfully",
    };
  }),

  bulkUpdate: adminProcedure
    .input(
      z.object({
        serviceIds: z
          .array(z.string())
          .min(1, "Please select at least one service."),
        categoryIds: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
        shopId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { serviceIds, categoryIds, tags, isPublic, shopId } = input;

      const dataToUpdate: Record<string, unknown> = {};

      if (shopId !== undefined) dataToUpdate.shopId = shopId;
      if (isPublic !== undefined) dataToUpdate.isPublic = isPublic;
      if (tags !== undefined) dataToUpdate.tags = { set: tags };

      if (categoryIds !== undefined) {
        const allCategoryIds = await getCategoriesWithParents(
          ctx.db,
          categoryIds,
        );
        dataToUpdate.categories = { set: allCategoryIds.map((id) => ({ id })) };
      }

      const updatedServices = [];
      for (const id of serviceIds) {
        const updatedService = await ctx.db.service.update({
          where: { id },
          data: dataToUpdate,
        });
        updatedServices.push(updatedService);
      }
      return {
        message: `Successfully updated ${updatedServices.length} services.`,
        data: updatedServices.map(addFullImageUrl),
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
        data: services.map(addFullImageUrl),
        message: "Services imported successfully",
      };
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
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.db.service.count({ where: { isPublic: true } }),
      ]);

      return {
        services: services.map(addFullImageUrl),
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
    return addFullImageUrl(service);
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
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.service.count({ where: { shopId } }),
      ]);

      return {
        services: services.map(addFullImageUrl),
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  getAllByCategory: publicProcedure
    .input(
      z.object({
        categoryName: z.string(),
        subcategoryName: z.string().optional(),
        storeId: z.string().optional(),
        attributes: z.array(z.string()).optional(),
        sort: z.enum(["asc", "desc"]).default("asc"),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        categoryName,
        subcategoryName,
        storeId,
        attributes,
        sort,
        search,
        page,
        limit,
      } = input;
      const skip = (page - 1) * limit;

      // If categoryName is "all-services", return all services (with filters)
      if (categoryName.toLowerCase() === "all-services") {
        const where: Prisma.ServiceWhereInput = {
          isPublic: true,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ];
        }
        if (storeId && storeId !== "all") {
          where.shopId = storeId;
        }
        if (attributes && attributes.length > 0) {
          where.shop = {
            attributeTags: { hasEvery: attributes },
          };
        }

        const [services, totalCount] = await ctx.db.$transaction([
          ctx.db.service.findMany({
            where,
            include: { shop: true, categories: true },
            orderBy: { name: sort },
            skip,
            take: limit,
          }),
          ctx.db.service.count({ where }),
        ]);

        // For "all-services", subcategories is always empty
        return {
          services: services.map(addFullImageUrl),
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          subcategories: [],
        };
      }

      const parentCategory = await ctx.db.category.findFirst({
        where: { name: { equals: categoryName, mode: "insensitive" } },
        include: { children: true },
      });

      if (!parentCategory) {
        return {
          services: [],
          totalCount: 0,
          totalPages: 0,
          subcategories: [],
        };
      }

      let categoryIdsToFilter: string[] = [parentCategory.id];
      if (subcategoryName) {
        const subcategory = parentCategory.children.find(
          (child) => child.name.toLowerCase() === subcategoryName.toLowerCase(),
        );
        if (subcategory) {
          categoryIdsToFilter = [subcategory.id];
        } else {
          return {
            services: [],
            totalCount: 0,
            totalPages: 0,
            subcategories: parentCategory.children,
          };
        }
      } else {
        categoryIdsToFilter.push(...parentCategory.children.map((c) => c.id));
      }

      const where: Prisma.ServiceWhereInput = {
        categories: { some: { id: { in: categoryIdsToFilter } } },
        isPublic: true,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }
      if (storeId && storeId !== "all") {
        where.shopId = storeId;
      }
      if (attributes && attributes.length > 0) {
        where.shop = {
          attributeTags: { hasEvery: attributes },
        };
      }

      const [services, totalCount] = await ctx.db.$transaction([
        ctx.db.service.findMany({
          where,
          include: { shop: true, categories: true },
          orderBy: { name: sort },
          skip,
          take: limit,
        }),
        ctx.db.service.count({ where }),
      ]);

      return {
        services: services.map(addFullImageUrl),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        subcategories: parentCategory.children,
      };
    }),
});
