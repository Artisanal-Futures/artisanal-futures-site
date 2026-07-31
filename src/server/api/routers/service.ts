import {
  type Category,
  type Prisma,
  type PrismaClient,
  type Service,
  type Shop,
} from "generated/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { addFullServiceImageUrl } from "~/lib/add-full-image-url";
import {
  checkUserOwnsServices,
  checkUserServicePermissions,
  checkUserShopPermissions,
} from "~/lib/check-user-permissions";
import {
  catalogSearchInput,
  SEARCH_CANDIDATE_CAP,
  searchCatalog,
} from "~/lib/search/catalog-search";
import { serviceSchema } from "~/lib/validators/services";
import { fromVisibleShop } from "~/server/api/shared/visibility";

type ServiceWithRelations = Service & {
  shop: Shop | null;
  categories: Category[];
};
import {
  adminArtisanProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const serviceRouter = createTRPCRouter({
  get: adminArtisanProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
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

      const service = await ctx.db.service.findUnique({
        where: { id: input },
        include: { shop: true, categories: true },
      });
      return addFullServiceImageUrl(service);
    }),
  getAll: adminArtisanProcedure.query(async ({ ctx }) => {
    const services = await ctx.db.service.findMany({
      include: { shop: true, categories: true },
      orderBy: { createdAt: "desc" },
    });

    let servicesWithFullUrls = services.map(addFullServiceImageUrl);

    if (ctx.session.user.role !== "ADMIN") {
      servicesWithFullUrls = servicesWithFullUrls.filter(
        (service) => service?.shop?.ownerId === ctx.session.user.id,
      );
    }

    return servicesWithFullUrls;
  }),

  getAllByCategory: publicProcedure
    .input(catalogSearchInput)
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

      const empty = (subcategories: Category[] = []) => ({
        services: [] as ServiceWithRelations[],
        totalCount: 0,
        totalPages: 0,
        subcategories,
        isFuzzy: false,
        appliedTerms: [] as string[],
        suggestions: [] as string[],
      });

      // Resolve which categories to filter by. `null` means "every category".
      let categoryIdsToFilter: string[] | null = null;
      let subcategories: Category[] = [];

      if (categoryName.toLowerCase() !== "all-services") {
        const parentCategory = await ctx.db.category.findFirst({
          where: { name: { equals: categoryName, mode: "insensitive" } },
          include: { children: true },
        });

        if (!parentCategory) return empty();
        subcategories = parentCategory.children;

        if (subcategoryName) {
          const subcategory = parentCategory.children.find(
            (child) =>
              child.name.toLowerCase() === subcategoryName.toLowerCase(),
          );
          if (!subcategory) return empty(parentCategory.children);
          categoryIdsToFilter = [subcategory.id];
        } else {
          categoryIdsToFilter = [
            parentCategory.id,
            ...parentCategory.children.map((child) => child.id),
          ];
        }
      }

      // Structural filters as an AND array — see the matching comment in
      // product.ts for why this replaced the previous `where.shop = {...}`.
      const and: Prisma.ServiceWhereInput[] = [
        { isPublic: true },
        fromVisibleShop,
      ];
      if (categoryIdsToFilter) {
        and.push({ categories: { some: { id: { in: categoryIdsToFilter } } } });
      }
      if (storeId && storeId !== "all") {
        and.push({ shopId: storeId });
      }
      if (attributes && attributes.length > 0) {
        // `hasSome`, not `hasEvery`: ticking more attributes widens results.
        and.push({ shop: { attributeTags: { hasSome: attributes } } });
      }
      const where: Prisma.ServiceWhereInput = { AND: and };

      // Browse path (no query): unchanged SQL ordering and pagination.
      if (!search) {
        const [services, totalCount] = await ctx.db.$transaction([
          ctx.db.service.findMany({
            where,
            include: { shop: true, categories: true },
            orderBy: { name: sort === "desc" ? "desc" : "asc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
          ctx.db.service.count({ where }),
        ]);

        return {
          services: services.map(addFullServiceImageUrl),
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          subcategories,
          isFuzzy: false,
          appliedTerms: [] as string[],
          suggestions: [] as string[],
        };
      }

      // Search path: ranking happens in Node. See src/lib/search/catalog-search.ts.
      const candidates = await ctx.db.service.findMany({
        where,
        include: { shop: true, categories: true },
        orderBy: { name: "asc" },
        take: SEARCH_CANDIDATE_CAP,
      });

      if (candidates.length === SEARCH_CANDIDATE_CAP) {
        console.warn(
          `[search] service candidate cap (${SEARCH_CANDIDATE_CAP}) reached; ` +
            `results and totalCount are truncated. Time to move search into Postgres.`,
        );
      }

      const { ranked, isFuzzy, appliedTerms, suggestions } = searchCatalog(
        candidates,
        search,
      );

      const ordered =
        sort === "relevance"
          ? ranked
          : [...ranked].sort((a, b) =>
              sort === "desc"
                ? b.name.localeCompare(a.name)
                : a.name.localeCompare(b.name),
            );

      const totalCount = ordered.length;
      const start = (page - 1) * limit;

      return {
        services: ordered
          .slice(start, start + limit)
          .map(addFullServiceImageUrl),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        subcategories,
        isFuzzy,
        appliedTerms,
        suggestions,
      };
    }),

  // NOTE: Services are not scraped/migrated (there's no reliable source to
  // import them from), so there is intentionally no `importServices` procedure.
  // Migration is products-only — see `product.importProducts`.

  bulkUpdate: adminArtisanProcedure
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
