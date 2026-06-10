import { type Prisma, type PrismaClient } from "generated/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { addFullServiceImageUrl } from "~/lib/add-full-image-url";
import {
  checkUserOwnsServices,
  checkUserServicePermissions,
  checkUserShopPermissions,
} from "~/lib/check-user-permissions";
import { serviceSchema } from "~/lib/validators/services";
import {
  adminArtisanProcedure,
  adminOnlyProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const serviceRouter = createTRPCRouter({
  get: adminOnlyProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const service = await ctx.db.service.findUnique({
      where: { id: input },
      include: { shop: true, categories: true },
    });
    return addFullServiceImageUrl(service);
  }),
  getAll: adminOnlyProcedure.query(async ({ ctx }) => {
    const services = await ctx.db.service.findMany({
      include: { shop: true, categories: true },
      orderBy: { createdAt: "desc" },
    });
    return services.map(addFullServiceImageUrl);
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
          services: services.map(addFullServiceImageUrl),
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
        services: services.map(addFullServiceImageUrl),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        subcategories: parentCategory.children,
      };
    }),

  // NOTE: Services are not scraped/migrated (there's no reliable source to
  // import them from), so there is intentionally no `importServices` procedure.
  // Migration is products-only — see `product.importProducts`.

  bulkUpdate: adminOnlyProcedure
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

      const isOwner = await checkUserOwnsServices(ctx.session, serviceIds);

      if (!isOwner) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "One or more services do not belong to current user",
        });
      }

      if (shopId) {
        const isShopOwner = await checkUserShopPermissions(
          ctx.session,
          shopId,
        );

        if (!isShopOwner) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Shop does not belong to current user",
          });
        }
      }

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
        data: updatedServices.map(addFullServiceImageUrl),
      };
    }),

  create: adminArtisanProcedure
    .input(serviceSchema)
    .mutation(async ({ ctx, input }) => {
      const isUserAuthorized = await checkUserShopPermissions(
        ctx.session,
        input.shopId,
      );

      if (!isUserAuthorized) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Shop does not belong to current user",
        });
      }

      const { categoryIds, tags, ...serviceData } = input;

      const allCategoryIds = await getCategoriesWithParents(
        ctx.db,
        categoryIds,
      );
      const formattedTags = tags.map((tag) => tag.text);
      const service = await ctx.db.service.create({
        data: {
          ...serviceData,
          tags: formattedTags,
          categories: { connect: allCategoryIds.map((id) => ({ id })) },
        },
      });
      return {
        data: {
          ...service,
          tags,
          categoryIds,
          shopId: input.shopId,
        },
        message: "Service created successfully",
      };
    }),

  update: adminArtisanProcedure
    .input(serviceSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isUserAuthorized = await checkUserServicePermissions(
        ctx.session,
        input.id,
      );

      if (!isUserAuthorized) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Product does not belong to current user",
        });
      }

      const { id, categoryIds, tags, ...serviceData } = input;

      const allCategoryIds = await getCategoriesWithParents(
        ctx.db,
        categoryIds,
      );
      const formattedTags = tags.map((tag) => tag.text);

      const service = await ctx.db.service.update({
        where: { id },
        data: {
          ...serviceData,
          tags: formattedTags,
          categories: { set: allCategoryIds.map((id) => ({ id })) },
        },
      });
      return {
        data: {
          ...service,
          tags,
          categoryIds,
          shopId: input.shopId,
        },
        message: "Service updated successfully",
      };
    }),

  // TODO: Need to verify what tags we are actually wanting for each incoming service
  updateTags: adminArtisanProcedure
    .input(
      z.object({
        serviceIds: z.array(z.string()),
        tagType: z.enum(["attributeTags", "aiGeneratedTags", "tags"]),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { serviceIds, tagType, tags } = input;

      const isOwner = await checkUserOwnsServices(ctx.session, serviceIds);

      if (!isOwner) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "One or more services do not belong to current user",
        });
      }
      const updatedServices = await Promise.all(
        serviceIds.map(async (id) => {
          return ctx.db.service.update({
            where: { id },
            data: { [tagType]: tags },
          });
        }),
      );
      return {
        data: updatedServices.map(addFullServiceImageUrl),
        message: `${updatedServices.length} services updated successfully`,
      };
    }),

  delete: adminArtisanProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const isUserAuthorized = await checkUserServicePermissions(
        ctx.session,
        input,
      );

      if (!isUserAuthorized) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Service does not belong to current user",
        });
      }

      await ctx.db.service.delete({
        where: { id: input },
      });
      return {
        data: null,
        message: "Service deleted successfully",
      };
    }),

  deleteMultiple: adminArtisanProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      const isAuthorized = await Promise.all(
        input.map(async (id) => {
          return checkUserServicePermissions(ctx.session, id);
        }),
      ).then((results) =>
        results.every((isAuthorized: boolean) => isAuthorized),
      );

      if (!isAuthorized) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "One or more services do not belong to current user",
        });
      }

      await ctx.db.service.deleteMany({
        where: { id: { in: input } },
      });
      return { data: null, message: "Services deleted successfully" };
    }),
});

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
