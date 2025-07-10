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

import { productSchema } from "~/lib/validators/products";

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
            data: {
              [tagType]: tags,
            },
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
      include: { shop: true },
      orderBy: {
        createdAt: "desc",
      },
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

      const [products, totalCount] = await Promise.all([
        ctx.db.product.findMany({
          include: { shop: true },
          orderBy: {
            createdAt: "desc",
          },
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

      return {
        products: productsWithFullUrls,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const product = await ctx.db.product.findUnique({
      where: { id: input },
      include: { shop: true },
    });
    return product;
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
          include: { shop: true },
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
        }),
        ctx.db.product.count({
          where: { shopId },
        }),
      ]);

      const productsWithFullUrls = products.map((product) => ({
        ...product,
        imageUrl:
          product.imageUrl && !product.imageUrl.startsWith("http")
            ? `https://storage.artisanalfutures.org/products/${product.imageUrl}`
            : product.imageUrl,
      }));

      return {
        products: productsWithFullUrls,
        totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  create: elevatedProcedure
    .input(productSchema)
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.create({
        data: {
          ...input,
        },
      });
      return {
        data: product,
        message: "Product created successfully",
      };
    }),

  update: elevatedProcedure
    .input(productSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const product = await ctx.db.product.update({
        where: { id },
        data,
      });
      return {
        data: product,
        message: "Product updated successfully",
      };
    }),

  delete: elevatedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.delete({
        where: { id: input },
      });
      return {
        data: product,
        message: "Product deleted successfully",
      };
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
    .input(z.object({ 
        categoryId: z.string().optional() 
    }))
    .query(async ({ ctx, input }) => {
      if (!input.categoryId) {
        return [];
      }
      
      const products = await ctx.db.product.findMany({
        where: {
          categories: {
            some: {
              id: input.categoryId,
            },
          },
          isPublic: true,
        },
        include: {
          shop: true,
          categories: true, 
        },
      });

      return products;
    }),
});
