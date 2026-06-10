import { $Enums, type Prisma, type PrismaClient } from "generated/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { addFullProductImageUrl } from "~/lib/add-full-image-url";
import {
  checkUserOwnsProducts,
  checkUserProductPermissions,
  checkUserShopPermissions,
} from "~/lib/check-user-permissions";
import { productSchema } from "~/lib/validators/products";
import {
  adminArtisanProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const productRouter = createTRPCRouter({
  getAll: adminArtisanProcedure.query(async ({ ctx }) => {
    // Always order by createdAt DESC in the DB query
    const products = await ctx.db.product.findMany({
      include: { shop: true, categories: true },
      orderBy: { createdAt: "desc" },
    });

    // Map to add full image URLs, but preserve the order from the DB
    let productsWithFullUrls = products.map(addFullProductImageUrl);

    // If not admin, filter by ownerId, then re-sort by createdAt DESC to ensure order
    if (ctx.session.user.role !== "ADMIN") {
      productsWithFullUrls = productsWithFullUrls
        .filter((product) => product.shop?.ownerId === ctx.session.user.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    return productsWithFullUrls;
  }),

  get: adminArtisanProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const product = await ctx.db.product.findUnique({
      where: { id: input },
      include: { shop: true, categories: true },
    });
    return addFullProductImageUrl(product);
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

      // If categoryName is "all", return all products (with filters)
      if (categoryName.toLowerCase() === "all-products") {
        const where: Prisma.ProductWhereInput = {
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

        const [products, totalCount] = await ctx.db.$transaction([
          ctx.db.product.findMany({
            where,
            include: { shop: true, categories: true },
            orderBy: { name: sort },
            skip,
            take: limit,
          }),
          ctx.db.product.count({ where }),
        ]);

        // For "all", subcategories is always empty
        return {
          products: products.map(addFullProductImageUrl),
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          subcategories: [],
        };
      }

      // Otherwise, filter by category as before
      const parentCategory = await ctx.db.category.findFirst({
        where: { name: { equals: categoryName, mode: "insensitive" } },
        include: { children: true },
      });

      if (!parentCategory) {
        return {
          products: [],
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
            products: [],
            totalCount: 0,
            totalPages: 0,
            subcategories: parentCategory.children,
          };
        }
      } else {
        categoryIdsToFilter.push(...parentCategory.children.map((c) => c.id));
      }

      const where: Prisma.ProductWhereInput = {
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

      const [products, totalCount] = await ctx.db.$transaction([
        ctx.db.product.findMany({
          where,
          include: { shop: true, categories: true },
          orderBy: { name: sort },
          skip,
          take: limit,
        }),
        ctx.db.product.count({ where }),
      ]);

      return {
        products: products.map(addFullProductImageUrl),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        subcategories: parentCategory.children,
      };
    }),

  importProducts: adminArtisanProcedure
    .input(z.array(productSchema.extend({ shopProductId: z.string() })))
    .mutation(async ({ ctx, input }) => {
      // Verify the caller owns every distinct shop referenced in the batch
      const distinctShopIds = [...new Set(input.map((p) => p.shopId))];

      for (const shopId of distinctShopIds) {
        const isShopOwner = await checkUserShopPermissions(
          ctx.session,
          shopId,
        );

        if (!isShopOwner) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: `Shop ${shopId} does not belong to current user`,
          });
        }
      }

      const products = await Promise.all(
        input.map(async (product) => {
          const existingProduct = await ctx.db.product.findFirst({
            where: {
              shopId: product.shopId,
              shopProductId: product.shopProductId,
            },
          });
          const { tags, ...productData } = product;
          const formattedTags = tags.map((tag) => tag.text);
          if (existingProduct) {
            return ctx.db.product.update({
              where: { id: existingProduct.id },
              data: { ...productData, tags: formattedTags },
            });
          }

          return ctx.db.product.create({
            data: { ...productData, tags: formattedTags },
          });
        }),
      );

      // Reconciliation: soft-hide products that were removed from the source
      // (i.e., not in this import batch) for each shop/scrapeMethod combination.
      // Only applies to non-MANUAL scrape methods — never touch manually-created products.
      for (const shopId of distinctShopIds) {
        const shopItems = input.filter((p) => p.shopId === shopId);

        // Collect the set of imported shopProductIds and non-MANUAL scrapeMethods for this shop
        const importedShopProductIds = shopItems
          .map((p) => p.shopProductId)
          .filter((id): id is string => typeof id === "string" && id.length > 0);

        const importedScrapeMethods = [
          ...new Set(
            shopItems
              .map((p) => p.scrapeMethod)
              .filter(
                (m): m is $Enums.ProductScrapeMethod =>
                  m !== undefined && m !== $Enums.ProductScrapeMethod.MANUAL,
              ),
          ),
        ];

        if (importedScrapeMethods.length === 0) {
          // All items are MANUAL; nothing to reconcile for this shop
          continue;
        }

        await ctx.db.product.updateMany({
          where: {
            shopId,
            scrapeMethod: { in: importedScrapeMethods, not: $Enums.ProductScrapeMethod.MANUAL },
            shopProductId: { notIn: importedShopProductIds },
          },
          data: { isPublic: false },
        });
      }

      return {
        data: products.map(addFullProductImageUrl),
        message: "Products imported successfully",
      };
    }),

  bulkUpdate: adminArtisanProcedure
    .input(
      z.object({
        productIds: z
          .array(z.string())
          .min(1, "Please select at least one product."),
        categoryIds: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
        shopId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productIds, categoryIds, tags, isPublic, shopId } = input;

      const isOwner = await checkUserOwnsProducts(ctx.session, productIds);

      if (!isOwner) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "One or more products do not belong to current user",
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

      // Filter only existing product IDs
      const existingProducts = await ctx.db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });

      const validIds = existingProducts.map((p) => p.id);

      if (validIds.length === 0) {
        throw new Error("No valid product IDs were found.");
      }

      // Compute all category + parent category IDs (if applicable)
      const allCategoryIds = categoryIds
        ? await getCategoriesWithParents(ctx.db, categoryIds)
        : [];

      const updatedProducts = await ctx.db.$transaction(
        validIds.map((id) =>
          ctx.db.product.update({
            where: { id },
            data: {
              ...(typeof isPublic === "boolean" && { isPublic }),
              ...(shopId && { shopId }),
              ...(tags && { tags: { set: tags } }),

              ...(categoryIds !== undefined
                ? {
                    categories: {
                      set: allCategoryIds.map((id) => ({ id })),
                    },
                  }
                : {}),
            },
          }),
        ),
      );

      return {
        message: `Successfully updated ${updatedProducts.length} product(s).`,
        data: updatedProducts.map(addFullProductImageUrl),
      };
    }),

  create: adminArtisanProcedure
    .input(productSchema)
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

      const { categoryIds, tags, ...productData } = input;

      const allCategoryIds = await getCategoriesWithParents(
        ctx.db,
        categoryIds,
      );

      const formattedTags = tags.map((tag) => tag.text);

      const product = await ctx.db.product.create({
        data: {
          ...productData,
          tags: formattedTags,
          categories: { connect: allCategoryIds.map((id) => ({ id })) },
        },
      });
      return {
        data: {
          ...product,
          tags,
          categoryIds,
          shopId: input.shopId,
        },
        message: "Product created successfully",
      };
    }),

  update: adminArtisanProcedure
    .input(productSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isUserAuthorized = await checkUserProductPermissions(
        ctx.session,
        input.id,
      );

      if (!isUserAuthorized) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Product does not belong to current user",
        });
      }

      const { id, categoryIds, tags, ...productData } = input;

      const allCategoryIds = await getCategoriesWithParents(
        ctx.db,
        categoryIds,
      );

      const formattedTags = tags.map((tag) => tag.text);

      const product = await ctx.db.product.update({
        where: { id },
        data: {
          ...productData,
          tags: formattedTags,
          categories: { set: allCategoryIds.map((id) => ({ id })) },
        },
      });
      return {
        data: {
          ...product,
          tags,
          categoryIds,
          shopId: input.shopId,
        },
        message: "Product updated successfully",
      };
    }),

  // TODO: Need to verify what tags we are actually wanting for each incoming product
  updateTags: adminArtisanProcedure
    .input(
      z.object({
        productIds: z.array(z.string()),
        tagType: z.enum([
          "attributeTags",
          "materialTags",
          "environmentalTags",
          "aiGeneratedTags",
        ]),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productIds, tagType, tags } = input;

      const isOwner = await checkUserOwnsProducts(ctx.session, productIds);

      if (!isOwner) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "One or more products do not belong to current user",
        });
      }
      const updatedProducts = await Promise.all(
        productIds.map(async (id) => {
          return ctx.db.product.update({
            where: { id },
            data: { [tagType]: tags },
          });
        }),
      );
      return {
        data: updatedProducts.map(addFullProductImageUrl),
        message: `${updatedProducts.length} products updated successfully`,
      };
    }),

  delete: adminArtisanProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const isUserAuthorized = await checkUserProductPermissions(
        ctx.session,
        input,
      );

      if (!isUserAuthorized) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Product does not belong to current user",
        });
      }

      await ctx.db.product.delete({
        where: { id: input },
      });
      return {
        data: null,
        message: "Product deleted successfully",
      };
    }),

  deleteMultiple: adminArtisanProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      const isAuthorized = await Promise.all(
        input.map(async (id) => {
          return checkUserProductPermissions(ctx.session, id);
        }),
      ).then((results) =>
        results.every((isAuthorized: boolean) => isAuthorized),
      );

      if (!isAuthorized) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "One or more products do not belong to current user",
        });
      }

      await ctx.db.product.deleteMany({
        where: { id: { in: input } },
      });
      return { data: null, message: "Products deleted successfully" };
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
