import { CategoryType } from "generated/prisma";
import { z } from "zod";

import { addFullProductImageUrl } from "~/lib/add-full-image-url";
import { categorySchema } from "~/lib/validators/category";
import {
  adminOnlyProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const categoryRouter = createTRPCRouter({
  getAll: adminOnlyProcedure.query(({ ctx }) => {
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
          parentId: input.parentId,
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
          parentId: input.parentId,
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
              where: { isFeatured: true },
              include: { shop: true },
            },
          },
          orderBy: { name: "asc" },
        });

        const formattedCategories = categories.map((category) => ({
          ...category,
          items: category.services.map((service) =>
            addFullProductImageUrl(service),
          ),
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
            where: { isFeatured: true },
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
                categories: { some: { id: category.id } },
                isFeatured: false,
                id: {
                  notIn: products.map((p) => p.id),
                },
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
