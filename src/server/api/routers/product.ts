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

  getAll: publicProcedure.query(async ({ ctx }) => {
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

    return productsWithFullUrls;
  }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const product = await ctx.db.product.findUnique({
      where: { id: input },
      include: { shop: true },
    });
    return product;
  }),

  getByShopId: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: { shopId: input },
        include: { shop: true },
      });
      return products;
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
});
