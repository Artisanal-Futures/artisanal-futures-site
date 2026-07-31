import type { Category, Prisma, PrismaClient } from "generated/prisma";
import type { ProductWithRelations } from "~/types/product";
import {
  adminArtisanProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { SafeFetchError } from "~/server/lib/safe-fetch";
import { SYNCED_FIELDS } from "~/server/lib/product-sync";
import {
  fetchStoreFeed,
  StoreFeedFormatError,
  StoreUrlError,
} from "~/server/lib/store-feed";
import { $Enums } from "generated/prisma";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import { addFullProductImageUrl } from "~/lib/add-full-image-url";
import {
  checkUserOwnsProducts,
  checkUserProductPermissions,
  checkUserShopPermissions,
} from "~/lib/check-user-permissions";
import {
  catalogSearchInput,
  SEARCH_CANDIDATE_CAP,
  searchCatalog,
} from "~/lib/search/catalog-search";
import { productSchema } from "~/lib/validators/products";
import { fromVisibleShop } from "~/server/api/shared/visibility";

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

    const product = await ctx.db.product.findUnique({
      where: { id: input },
      include: { shop: true, categories: true },
    });
    return addFullProductImageUrl(product);
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
        products: [] as ProductWithRelations[],
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

      if (categoryName.toLowerCase() !== "all-products") {
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

      // Build the structural filters as an AND array. Previously each filter
      // assigned `where.shop = {...}`, so filters silently clobbered each
      // other as more of them were added.
      const and: Prisma.ProductWhereInput[] = [
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
        // `hasSome`, not `hasEvery`: these checkboxes read as a facet list, so
        // ticking a second attribute should widen the results, not require a
        // shop to carry every selected attribute at once.
        and.push({ shop: { attributeTags: { hasSome: attributes } } });
      }
      const where: Prisma.ProductWhereInput = { AND: and };

      // Browse path (no query): unchanged SQL ordering and pagination.
      if (!search) {
        const [products, totalCount] = await ctx.db.$transaction([
          ctx.db.product.findMany({
            where,
            include: { shop: true, categories: true },
            orderBy: { name: sort === "desc" ? "desc" : "asc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
          ctx.db.product.count({ where }),
        ]);

        return {
          products: products.map(addFullProductImageUrl),
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          subcategories,
          isFuzzy: false,
          appliedTerms: [] as string[],
          suggestions: [] as string[],
        };
      }

      // Search path: text matching and relevance ranking happen in Node. See
      // src/lib/search/catalog-search.ts for why they can't happen in SQL.
      const candidates = await ctx.db.product.findMany({
        where,
        include: { shop: true, categories: true },
        orderBy: { name: "asc" },
        take: SEARCH_CANDIDATE_CAP,
      });

      if (candidates.length === SEARCH_CANDIDATE_CAP) {
        console.warn(
          `[search] product candidate cap (${SEARCH_CANDIDATE_CAP}) reached; ` +
            `results and totalCount are truncated. Time to move search into Postgres.`,
        );
      }

      const { ranked, isFuzzy, appliedTerms, suggestions } = searchCatalog(
        candidates,
        search,
      );

      // Relevance is the default while searching, but an explicit A-Z/Z-A
      // choice still wins.
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
        products: ordered
          .slice(start, start + limit)
          .map(addFullProductImageUrl),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        subcategories,
        isFuzzy,
        appliedTerms,
        suggestions,
      };
    }),

  // Server-side "fetch from my store" for the migration wizard. Thin wrapper
  // around `fetchStoreFeed` (see ~/server/lib/store-feed) which owns every
  // platform's feed URL, pagination caps and TLS handling — the scheduled
  // product sync calls that same helper directly.
  //
  // The returned `json` is shaped exactly like the manual export so the shared
  // `mapProducts` parser handles it unchanged.
  fetchFromStore: adminArtisanProcedure
    .input(
      z.object({
        shopId: z.string().min(1),
        platform: z.enum([
          "shopify",
          "wordpress",
          "squarespace",
          "simplepress",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const isShopOwner = await checkUserShopPermissions(
        ctx.session,
        input.shopId,
      );
      if (!isShopOwner) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Shop does not belong to current user",
        });
      }

      const shop = await ctx.db.shop.findUnique({
        where: { id: input.shopId },
        select: { website: true, syncUrl: true, allowInsecureOrigin: true },
      });

      const website = shop?.syncUrl?.trim() ?? shop?.website?.trim();

      if (!website) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This shop has no website on file. Add the store URL to the shop, or paste the export manually.",
        });
      }

      try {
        return await fetchStoreFeed({
          website,
          platform: input.platform,
          allowInsecureOrigin: shop?.allowInsecureOrigin ?? false,
        });
      } catch (err) {
        if (err instanceof StoreUrlError || err instanceof StoreFeedFormatError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
        }
        if (err instanceof SafeFetchError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
        }
        if (err instanceof SyntaxError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "The store responded but the data wasn't in the expected format. Try the manual paste flow.",
          });
        }
        console.error(
          `[fetchFromStore] Feed fetch failed for shop ${input.shopId}:`,
          err,
        );
        throw err;
      }
    }),

  importProducts: adminArtisanProcedure
    .input(z.array(productSchema.extend({ shopProductId: z.string() })))
    .mutation(async ({ ctx, input }) => {
      // Verify the caller owns every distinct shop referenced in the batch
      const distinctShopIds = [...new Set(input.map((p) => p.shopId))];

      for (const shopId of distinctShopIds) {
        const isShopOwner = await checkUserShopPermissions(ctx.session, shopId);

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
          .filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          );

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
            scrapeMethod: {
              in: importedScrapeMethods,
              not: $Enums.ProductScrapeMethod.MANUAL,
            },
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
        const isShopOwner = await checkUserShopPermissions(ctx.session, shopId);

        if (!isShopOwner) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Shop does not belong to current user",
          });
        }
      }

      // Filter only existing product IDs. `isPublic`/`manualFields` come along
      // because a bulk visibility change has to be recorded per row (below).
      const existingProducts = await ctx.db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, isPublic: true, manualFields: true },
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
        existingProducts.map((product) =>
          ctx.db.product.update({
            where: { id: product.id },
            data: {
              ...(typeof isPublic === "boolean" && {
                isPublic,
                // Hiding or publishing by hand has to outrank the scheduled
                // sync's own visibility rules, so it is recorded in
                // `manualFields` — the same thing `update` does when the single
                // -product form changes visibility. Union rather than replace,
                // and only when the value actually changes, so re-applying the
                // state a product is already in doesn't claim the field.
                //
                // This is why the mutation is one update per row instead of a
                // single `updateMany`: merging into a per-row array can't be
                // expressed as one set-everything write.
                ...(product.isPublic !== isPublic
                  ? {
                      manualFields: [
                        ...new Set([...product.manualFields, "isPublic"]),
                      ],
                    }
                  : {}),
              }),
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

      // Record which sync-owned fields a human has now edited, so the scheduled
      // product sync stops proposing to overwrite them. Union rather than
      // replace: a field stays claimed once someone has curated it, even if a
      // later edit leaves it untouched.
      const existing = await ctx.db.product.findUnique({
        where: { id },
        select: {
          manualFields: true,
          name: true,
          description: true,
          priceInCents: true,
          currency: true,
          imageUrl: true,
          productUrl: true,
          isPublic: true,
        },
      });

      const manualFields = new Set(existing?.manualFields ?? []);
      if (existing) {
        for (const field of SYNCED_FIELDS) {
          const before = existing[field] ?? null;
          const after = productData[field] ?? null;
          // Compare loosely: the form round-trips numbers as strings and empty
          // inputs as "", neither of which is a real edit. Every synced field is
          // a scalar, so string/number is the whole domain here.
          const normalize = (v: string | number | null | undefined) =>
            v === null || v === undefined || v === "" ? null : String(v);
          if (normalize(before) !== normalize(after)) {
            manualFields.add(field);
          }
        }
        // Visibility isn't a synced field, but a deliberate hide has to outrank
        // the sync's "it's back upstream, unhide it" rule — so record it too.
        if (existing.isPublic !== productData.isPublic) {
          manualFields.add("isPublic");
        }
      }

      const product = await ctx.db.product.update({
        where: { id },
        data: {
          ...productData,
          tags: formattedTags,
          manualFields: [...manualFields],
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
