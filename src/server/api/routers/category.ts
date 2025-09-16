import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";

import { CategoryType } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters long."),
  parentId: z.string().nullable().optional(),
  type: z.nativeEnum(CategoryType).optional(),
});

export const categoryRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    if (ctx.session.user.role !== "ADMIN") {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return ctx.db.category.findMany({
      orderBy: { name: "asc" },
      include: { parent: true },
    });
  }),

  create: protectedProcedure
    .input(categorySchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.db.category.create({
        data: {
          name: input.name,
          parentId: input.parentId,
          type: input.type ?? CategoryType.PRODUCT,
        },
      });
    }),

  update: protectedProcedure
    .input(categorySchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      if (!input.id) {
        throw new Error("Category ID is required for an update.");
      }
      return ctx.db.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          parentId: input.parentId,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return ctx.db.category.delete({
        where: { id: input.id },
      });
    }),

  // --- PUBLIC PROCEDURES ---

  /**
   * @description Fetches the category tree for the main site navigation.
   * It can now be filtered by type (PRODUCT or SERVICE).
   */
  getNavigationTree: publicProcedure
    .input(
      z
        .object({
          type: z.nativeEnum(CategoryType).optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      return ctx.db.category.findMany({
        where: {
          parentId: null,
          type: input?.type,
        },
        include: { children: true },
      });
    }),

  /**
   * @description Fetches a single category by its slug for the public category pages.
   */
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

  getCategoriesWithFeaturedProducts: publicProcedure
    .input(
      z
        .object({
          type: z.nativeEnum(CategoryType).optional(),
        })
        .optional(),
    )
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
              where: {
                isFeatured: true,
              },
              include: {
                shop: true,
              },
            },
          },
        });

        const formattedCategories = categories.map((category) => ({
          ...category,
          items: category.services.map((service) => service),
        }));
        return formattedCategories;
      }

      const categories = await ctx.db.category.findMany({
        where: {
          parentId: null,
          type: input?.type,
        },
        include: {
          children: true,
          products: {
            take: 4,
            where: {
              isFeatured: true,
            },
            include: {
              shop: true,
            },
          },
        },
      });
      const formattedCategories = categories.map((category) => ({
        ...category,
        items: category.products.map((product) => product),
      }));
      return formattedCategories;
    }),
});
