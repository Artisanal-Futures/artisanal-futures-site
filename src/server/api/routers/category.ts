import { CategoryType } from "generated/prisma";
import { z } from "zod";

import {
  addFullProductImageUrl,
  addFullServiceImageUrl,
} from "~/lib/add-full-image-url";
import { categorySchema } from "~/lib/validators/category";
import { fromVisibleShop } from "~/server/api/shared/visibility";
import {
  adminArtisanProcedure,
  adminOnlyProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

// The form's "None" option can arrive as "", "null" or null; treat all as no
// parent. `undefined` is preserved so partial updates leave the parent alone.
const normalizeParentId = (parentId?: string | null) =>
  parentId === undefined
    ? undefined
    : !parentId || parentId === "null"
      ? null
      : parentId;

export const categoryRouter = createTRPCRouter({
  getAll: adminArtisanProcedure.query(({ ctx }) => {
    return ctx.db.category.findMany({
      orderBy: { name: "asc" },
      include: { parent: true },
    });
  }),

  create: adminOnlyProcedure
    .input(categorySchema)
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.category.create({
        data: {
          name: input.name,
          parentId: normalizeParentId(input.parentId),
          type: input.type ?? CategoryType.PRODUCT,
        },
      });
      return {
        data: category,
        message: "Category created successfully",
      };
    }),

  update: adminOnlyProcedure
    .input(categorySchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          parentId: normalizeParentId(input.parentId),
          type: input.type,
        },
      });
      return {
        data: category,
        message: "Category updated successfully",
      };
    }),

  delete: adminOnlyProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Children are removed automatically via the onDelete: Cascade on the
      // Category self-relation (see prisma/models/categories.prisma).
      await ctx.db.category.delete({
        where: { id: input.id },
      });
      return {
        data: null,
        message: "Category deleted successfully",
      };
    }),

  deleteMany: adminOnlyProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input: ids }) => {
      await ctx.db.category.deleteMany({
        where: { id: { in: ids } },
      });
      return {
        data: null,
        message: "Categories deleted successfully",
      };
    }),

  getNavigationTree: publicProcedure
    .input(z.object({ type: z.nativeEnum(CategoryType).optional() }).optional())
    .query(({ ctx, input }) => {
      return ctx.db.category.findMany({
        where: {
          parentId: null,
          type: input?.type,
        },
        include: { children: true },
      });
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => {
      if (input.slug === "all-products") {
        return {
          name: "All",
          id: "all-products",
          children: [],
          type: CategoryType.PRODUCT,
          parentId: null,
        };
      }
      if (input.slug === "all-services") {
        return {
          name: "All",
          id: "all-services",
          children: [],
          type: CategoryType.SERVICE,
          parentId: null,
        };
      }

      return ctx.db.category.findFirst({
        where: { name: { equals: input.slug, mode: "insensitive" } },
        include: { children: true },
      });
    }),

  get: adminOnlyProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.category.findUnique({
      where: { id: input },
    });
  }),
  getCategoriesWithFeaturedProducts: publicProcedure
    .input(z.object({ type: z.nativeEnum(CategoryType).optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (input?.type === CategoryType.SERVICE) {
        const categories = await ctx.db.category.findMany({
          where: {
            parentId: null,
            type: input?.type,
          },
          include: {
            children: true,
            services: {
              take: 4,
              // `isPublic` has to be honoured here as well as `isFeatured`.
              // This is a public procedure feeding the category landing page,
              // so without it a hidden service is featured to everyone.
              where: {
                AND: [{ isFeatured: true, isPublic: true }, fromVisibleShop],
              },
              include: { shop: true },
            },
          },
          orderBy: { name: "asc" },
        });

        const formattedCategories = categories.map((category) => ({
          ...category,
          items: category.services.map(addFullServiceImageUrl),
        }));
        return formattedCategories;
      }

      // First, get the categories and their featured products (up to 4)
      let categories = await ctx.db.category.findMany({
        where: {
          parentId: null,
          type: input?.type,
        },
        include: {
          children: true,
          products: {
            take: 4,
            // See the services branch above: public procedure, so `isPublic`
            // must be filtered alongside `isFeatured`.
            where: {
              AND: [{ isFeatured: true, isPublic: true }, fromVisibleShop],
            },
            include: { shop: true },
          },
        },
        orderBy: { name: "asc" },
      });

      // If any category has less than 4 featured products, fill in with non-featured products
      categories = await Promise.all(
        categories.map(async (category) => {
          let products = category.products;
          if (products.length < 4) {
            // Find more products (non-featured), ignoring those already in products
            const additionalProducts = await ctx.db.product.findMany({
              where: {
                AND: [
                  {
                    categories: { some: { id: category.id } },
                    isFeatured: false,
                    isPublic: true,
                    id: { notIn: products.map((p) => p.id) },
                  },
                  fromVisibleShop,
                ],
              },
              include: { shop: true },
              take: 4 - products.length,
              orderBy: { createdAt: "desc" },
            });
            products = [...products, ...additionalProducts];
          }
          return { ...category, products };
        }),
      );

      const formattedCategories = categories.map((category) => ({
        ...category,
        items: category.products.map((product) =>
          addFullProductImageUrl(product),
        ),
      }));
      return formattedCategories;
    }),
});
