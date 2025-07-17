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

const productSchema = z.object({
  name: z.string(),
  description: z.string(),
  priceInCents: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  productUrl: z.string().optional().nullable(),
  tags: z.array(z.string()),
  attributeTags: z.array(z.string()),
  materialTags: z.array(z.string()),
  environmentalTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  scrapeMethod: z.enum(["MANUAL", "WORDPRESS", "SHOPIFY", "SQUARESPACE"]).default("MANUAL"),
  shopId: z.string(),
  shopProductId: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
});

export const productRouter = createTRPCRouter({
  updateTags: elevatedProcedure
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
      const updatedProducts = await Promise.all(
        productIds.map(async (id) => {
          return ctx.db.product.update({
            where: { id },
            data: { [tagType]: tags },
          });
        }),
      );
      return {
        data: updatedProducts,
        message: `${updatedProducts.length} products updated successfully`,
      };
    }),

  getAll: elevatedProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      include: { shop: true, categories: true },
      orderBy: { createdAt: "desc" },
    });

    const productsWithFullUrls = products.map((product) => ({
      ...product,
      imageUrl:
        product.imageUrl && !product.imageUrl.startsWith("http")
          ? `https://storage.artisanalfutures.org/products/${product.imageUrl}`
          : product.imageUrl,
    }));

    if (ctx.session.user.role !== "ADMIN") {
      return productsWithFullUrls.filter(
        (product) => product.shop?.ownerId === ctx.session.user.id,
      );
    }

    return productsWithFullUrls;
  }),

  getAllValid: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;
      const [products, totalCount] = await Promise.all([
        ctx.db.product.findMany({
          include: { shop: true, categories: true },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.db.product.count(),
      ]);

      const productsWithFullUrls = products.map((product) => ({
        ...product,
        imageUrl:
          product.imageUrl && !product.imageUrl.startsWith("http")
            ? `https://storage.artisanalfutures.org/products/${product.imageUrl}`
            : product.imageUrl,
      }));

      return { products: productsWithFullUrls, totalCount, page, totalPages: Math.ceil(totalCount / limit) };
    }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.product.findUnique({
      where: { id: input },
      include: { shop: true, categories: true },
    });
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

      const [products, totalCount] = await Promise.all([
        ctx.db.product.findMany({
          where: { shopId },
          include: { shop: true, categories: true },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.product.count({ where: { shopId } }),
      ]);

      const productsWithFullUrls = products.map((product) => ({
        ...product,
        imageUrl:
          product.imageUrl && !product.imageUrl.startsWith("http")
            ? `https://storage.artisanalfutures.org/products/${product.imageUrl}`
            : product.imageUrl,
      }));

      return { products: productsWithFullUrls, totalCount, page, totalPages: Math.ceil(totalCount / limit) };
    }),

  create: elevatedProcedure
    .input(productSchema)
    .mutation(async ({ ctx, input }) => {
      const { categoryIds, ...productData } = input;
      const product = await ctx.db.product.create({
        data: {
          ...productData,
          categories: {
            connect: categoryIds?.map((id) => ({ id })),
          },
        },
      });
      return { data: product, message: "Product created successfully" };
    }),

  update: elevatedProcedure
    .input(productSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, categoryIds, ...productData } = input;
      const product = await ctx.db.product.update({
        where: { id },
        data: {
          ...productData,
          categories: {
            set: categoryIds?.map((id) => ({ id })),
          },
        },
      });
      return { data: product, message: "Product updated successfully" };
    }),

  delete: elevatedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.delete({
        where: { id: input },
      });
    }),

  importProducts: publicProcedure
    .input(z.array(productSchema.extend({ shopProductId: z.string() })))
    .mutation(async ({ ctx, input }) => {
      const products = await Promise.all(
        input.map(async (product) => {
          const existingProduct = await ctx.db.product.findFirst({
            where: {
              shopId: product.shopId,
              shopProductId: product.shopProductId,
            },
          });

          if (existingProduct) {
            return ctx.db.product.update({
              where: { id: existingProduct.id },
              data: product,
            });
          }

          return ctx.db.product.create({
            data: product,
          });
        }),
      );

      return {
        data: products,
        message: "Products imported successfully",
      };
    }),

   getAllByCategory: publicProcedure
    .input(z.object({ categoryIds: z.array(z.string()).optional() }))
    .query(async ({ ctx, input }) => {
      if (!input.categoryIds || input.categoryIds.length === 0) return [];
      return ctx.db.product.findMany({
        where: {
          categories: { some: { id: { in: input.categoryIds } } },
          isPublic: true,
        },
        include: { shop: true, categories: true },
      });
    }),

    bulkUpdate: elevatedProcedure
    .input(
      z.object({
        productIds: z.array(z.string()).min(1, "Please select at least one product."),
        // All fields are optional, so you can update just one thing at a time.
        categoryIds: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
        shopId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productIds, categoryIds, tags, isPublic, shopId } = input;

      // Prepare the data object with only the fields that were provided.
      const dataToUpdate: {
        shopId?: string;
        isPublic?: boolean;
        tags?: { set: string[] };
        categories?: { set: { id: string }[] };
      } = {};

      if (shopId !== undefined) {
        dataToUpdate.shopId = shopId;
      }
      if (isPublic !== undefined) {
        dataToUpdate.isPublic = isPublic;
      }
      if (tags !== undefined) {
        dataToUpdate.tags = { set: tags };
      }
      if (categoryIds !== undefined) {
        dataToUpdate.categories = { set: categoryIds.map((id) => ({ id })) };
      }

      const updatedProducts = await Promise.all(
        productIds.map(id => ctx.db.product.update({
          where: { id },
          data: dataToUpdate
        }))
      );

      return {
        message: `Successfully updated ${updatedProducts.length} products.`,
        data: updatedProducts,
      };
    }),
});
