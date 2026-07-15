import type { Prisma, PrismaClient } from "generated/prisma";
import {
  adminArtisanProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { SafeFetchError, safeFetchText } from "~/server/lib/safe-fetch";
import { $Enums } from "generated/prisma";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import { addFullProductImageUrl } from "~/lib/add-full-image-url";
import {
  checkUserOwnsProducts,
  checkUserProductPermissions,
  checkUserShopPermissions,
} from "~/lib/check-user-permissions";
import { productSchema } from "~/lib/validators/products";

// --- WordPress featured-media resolution (server-side) ---------------------
// WordPress exposes a product's image on a *separate* media endpoint, not on
// the product object. We resolve it here on the server (no CORS, and one
// request per page when `_embed` is honored) and inject a flat
// `featured_image_url` field that the client import parser reads directly.
type WpMedia = { source_url?: string; guid?: { rendered?: string } };
type WpFetchedProduct = {
  featured_media?: number;
  _embedded?: { "wp:featuredmedia"?: WpMedia[] };
  _links?: { "wp:featuredmedia"?: Array<{ href?: string }> };
  [key: string]: unknown;
};

function imageFromEmbedded(product: WpFetchedProduct): string | null {
  const media = product._embedded?.["wp:featuredmedia"]?.[0];
  return media?.source_url ?? media?.guid?.rendered ?? null;
}

/**
 * Resolve each WordPress product's featured image into a flat
 * `featured_image_url`. Prefers the `_embedded` media that `_embed` returns
 * inline; for installs that ignore `_embed`, falls back to fetching the
 * product's media href server-side, with bounded concurrency and a hard cap so
 * a no-embed store can't trigger thousands of outbound requests.
 */
async function resolveWordPressImages(
  products: WpFetchedProduct[],
  onInsecureTLSFallback?: (certCode: string) => void,
): Promise<Array<WpFetchedProduct & { featured_image_url: string | null }>> {
  const MAX_HREF_FETCHES = 100;
  const CONCURRENCY = 6;
  let hrefFetches = 0;
  let cursor = 0;
  const results = new Array<
    WpFetchedProduct & { featured_image_url: string | null }
  >(products.length);

  async function worker() {
    while (cursor < products.length) {
      const i = cursor++;
      const product = products[i]!;
      let imageUrl = imageFromEmbedded(product);
      if (!imageUrl) {
        const href = product._links?.["wp:featuredmedia"]?.[0]?.href;
        const hasMedia =
          typeof product.featured_media === "number" &&
          product.featured_media > 0;
        if (href && hasMedia && hrefFetches < MAX_HREF_FETCHES) {
          hrefFetches++;
          try {
            const media = JSON.parse(
              await safeFetchText(href, {
                allowInsecureTLSFallback: true,
                onInsecureTLSFallback,
              }),
            ) as WpMedia;
            imageUrl = media.source_url ?? media.guid?.rendered ?? null;
          } catch (err) {
            console.error(
              `[fetchFromStore] Failed to resolve WP media ${href}:`,
              err,
            );
          }
        }
      }
      results[i] = { ...product, featured_image_url: imageUrl };
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, products.length) }, worker),
  );
  return results;
}

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

  // Server-side "fetch from my store" for the migration wizard. Fetches the
  // shop's public product feed so artisans don't have to copy-paste JSON.
  //
  // Shopify (`/products.json`) and WordPress (`/wp-json/wp/v2/product`) have a
  // fixed feed path we can derive from the shop's domain. Squarespace has no
  // site-wide feed — instead any page returns its data as JSON when you append
  // `?format=json`. So Squarespace only works if the shop's stored website is
  // the *page that lists products* (e.g. business.com/store), not just the
  // homepage; the wizard warns the artisan about this.
  //
  // The returned `json` is shaped exactly like the manual export so the
  // existing client-side `mapProducts` parser handles it unchanged.
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
        select: { website: true },
      });

      if (!shop?.website?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This shop has no website on file. Add the store URL to the shop, or paste the export manually.",
        });
      }

      // Parse the stored website once, forcing https. `origin` (no path/query)
      // is used by Shopify/WordPress; `storeUrl` keeps the full path for
      // Squarespace, whose feed lives at the products page itself.
      let storeUrl: URL;
      try {
        const trimmed = shop.website.trim();
        const withScheme = /^https?:\/\//i.test(trimmed)
          ? trimmed
          : `https://${trimmed}`;
        storeUrl = new URL(withScheme);
        storeUrl.protocol = "https:";
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `The shop website "${shop.website}" is not a valid URL.`,
        });
      }
      const origin = storeUrl.origin;

      // Set when a fetch had to fall back to skipping TLS verification because
      // the store's certificate is invalid/expired. Surfaced to the client so
      // the artisan gets a heads-up to renew their certificate.
      let insecureTLSCode: string | null = null;
      const onInsecureTLSFallback = (certCode: string) => {
        insecureTLSCode ??= certCode;
      };

      try {
        if (input.platform === "shopify") {
          // Shopify exposes /products.json with page-based pagination.
          const MAX_PAGES = 40; // 40 * 250 = up to 10k products
          const products: unknown[] = [];
          for (let page = 1; page <= MAX_PAGES; page++) {
            const text = await safeFetchText(
              `${origin}/products.json?limit=250&page=${page}`,
              { allowInsecureTLSFallback: true, onInsecureTLSFallback },
            );
            const parsed = JSON.parse(text) as { products?: unknown[] };
            const batch = parsed.products ?? [];
            products.push(...batch);
            if (batch.length < 250) break;
          }
          return {
            json: JSON.stringify({ products }),
            count: products.length,
            insecureTLSCode,
          };
        }

        if (input.platform === "simplepress") {
          // SimplePress exposes a single flat product feed at /api/products
          // (no pagination). The response is { business, products }; we hand
          // back just `{ products }` to match the client-side parser.
          const text = await safeFetchText(`${origin}/api/products`, {
            allowInsecureTLSFallback: true,
            onInsecureTLSFallback,
          });
          const parsed = JSON.parse(text) as { products?: unknown[] };
          const products = Array.isArray(parsed.products)
            ? parsed.products
            : [];
          console.log(
            `[fetchFromStore] SimplePress import for shop ${input.shopId} (${origin}) collected ${products.length} products.`,
          );
          return {
            json: JSON.stringify({ products }),
            count: products.length,
            insecureTLSCode,
          };
        }

        if (input.platform === "squarespace") {
          // Squarespace renders any page as JSON when you append
          // `?format=json`. There's no site-wide product feed, so we fetch the
          // exact page the artisan saved as their website (path preserved) and
          // paginate via the `pagination` offset the response hands back.
          type SquarespaceFeed = {
            items?: unknown[];
            pagination?: { nextPage?: boolean; nextPageOffset?: number };
          };
          const MAX_PAGES = 30; // ~20 items/page -> up to ~600 products
          const items: unknown[] = [];
          let offset: number | undefined;
          for (let page = 0; page < MAX_PAGES; page++) {
            const pageUrl = new URL(storeUrl.href);
            pageUrl.searchParams.set("format", "json");
            if (offset !== undefined) {
              pageUrl.searchParams.set("offset", String(offset));
            }
            const text = await safeFetchText(pageUrl.href, {
              allowInsecureTLSFallback: true,
              onInsecureTLSFallback,
            });
            const feed = JSON.parse(text) as SquarespaceFeed;
            const batch = Array.isArray(feed.items) ? feed.items : [];
            items.push(...batch);
            if (
              batch.length === 0 ||
              !feed.pagination?.nextPage ||
              typeof feed.pagination.nextPageOffset !== "number"
            ) {
              break;
            }
            offset = feed.pagination.nextPageOffset;
          }
          console.log(
            `[fetchFromStore] Squarespace import for shop ${input.shopId} (${storeUrl.href}) collected ${items.length} products.`,
          );
          return {
            json: JSON.stringify({ items }),
            count: items.length,
            insecureTLSCode,
          };
        }

        // WordPress REST API: /wp-json/wp/v2/product with per_page/page.
        // `_embed=wp:featuredmedia` asks WP to inline each product's featured
        // image so we don't have to make a separate request per product.
        const MAX_PAGES = 50; // 50 * 100 = up to 5k products
        const products: WpFetchedProduct[] = [];
        for (let page = 1; page <= MAX_PAGES; page++) {
          const fetchUrl = `${origin}/wp-json/wp/v2/product?per_page=100&page=${page}&_embed=wp:featuredmedia`;
          console.log(`[fetchFromStore] WordPress fetch URL: ${fetchUrl}`);
          let text: string;
          try {
            text = await safeFetchText(fetchUrl, {
              allowInsecureTLSFallback: true,
              onInsecureTLSFallback,
            });
          } catch (err) {
            // WP returns a 400 once you page past the end; stop gracefully if
            // we've already collected something, otherwise surface the error.
            if (page > 1 && err instanceof SafeFetchError) break;
            console.error(
              `[fetchFromStore] WordPress fetch failed (shop ${input.shopId}, ${fetchUrl}):`,
              err,
            );
            throw err;
          }
          const parsed = JSON.parse(text) as unknown;
          if (!Array.isArray(parsed)) {
            // A 200 that isn't an array is almost always a WP error object
            // ({"code":"rest_no_route",...}) or an unexpected payload shape.
            console.error(
              `[fetchFromStore] WordPress returned a non-array payload (shop ${input.shopId}, ${fetchUrl}): ${text.slice(
                0,
                500,
              )}`,
            );
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "The store didn't return a product list. This site may not expose products at /wp-json/wp/v2/product — try the manual paste flow.",
            });
          }
          const batch = parsed as WpFetchedProduct[];
          if (batch.length === 0) break;
          products.push(...batch);
          if (batch.length < 100) break;
        }
        const withImages = await resolveWordPressImages(
          products,
          onInsecureTLSFallback,
        );
        const resolvedCount = withImages.filter(
          (p) => p.featured_image_url,
        ).length;
        console.log(
          `[fetchFromStore] WordPress import for shop ${input.shopId} (${origin}) collected ${withImages.length} products (${resolvedCount} with images).`,
        );
        return {
          json: JSON.stringify(withImages),
          count: withImages.length,
          insecureTLSCode,
        };
      } catch (err) {
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
