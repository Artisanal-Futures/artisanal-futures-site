import {
  createTRPCRouter,
  elevatedProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import { shopSchema } from "~/lib/validators/shop";

export const shopsRouter = createTRPCRouter({
  getAllValid: publicProcedure.query(({ ctx }) => {
    return ctx.db.shop.findMany({
      where: {
        name: { not: "" },
        OR: [{ logoPhoto: { not: "" } }, { ownerPhoto: { not: "" } }],
        website: { not: "" },
      },
    });
  }),
  getAll: elevatedProcedure.query(async ({ ctx }) => {
    const shops = await ctx.db.shop.findMany({
      include: { owner: true, address: true },
      orderBy: { createdAt: "desc" },
    });

    if (ctx.session.user.role !== "ADMIN") {
      return shops.filter((shop) => shop.ownerId === ctx.session.user.id);
    }

    return shops.map((shop) => ({
      ...shop,
      logoPhoto: `${shop?.logoPhoto}`,
      ownerPhoto: `${shop?.ownerPhoto}`,
      coverPhoto: `${shop?.coverPhoto}`,
    }));
  }),

  get: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: shopId }) => {
      const shop = await ctx.db.shop.findUnique({
        where: { id: shopId },
        include: { address: true },
      });

      return shop;
    }),

  getCurrentUserShop: protectedProcedure.query(({ ctx }) => {
    return ctx.db.shop.findFirst({
      where: {
        ownerId: ctx.session.user.id,
      },
    });
  }),
  create: elevatedProcedure
    .input(
      shopSchema.extend({
        logoPhoto: z.string().optional().nullish(),
        ownerPhoto: z.string().optional().nullish(),
        coverPhoto: z.string().optional().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shop = await ctx.db.shop.create({
        data: {
          name: input.name,
          ownerName: input.ownerName
            ? input.ownerName
            : (ctx.session.user?.name ?? ""),
          ownerId: input.ownerId ? input.ownerId : ctx.session.user.id,
          bio: input.bio ?? "",
          description: input.description ?? "",
          logoPhoto: input.logoPhoto,
          ownerPhoto: input.ownerPhoto,
          coverPhoto: input.coverPhoto,
          attributeTags: input.attributeTags ?? [],
          address: {
            create: {
              address: input.address ?? "",
              city: input.city ?? "",
              state: input.state ?? "",
              zip: input.zip ?? "",
              country: input.country ?? "",
            },
          },
          phone: input.phone ?? "",
          email: input.email ?? "",
          website: input.website ?? "",
        },
      });

      return { data: shop, message: "Shop created successfully" };
    }),

  update: elevatedProcedure
    .input(
      shopSchema.extend({
        id: z.string(),
        logoPhoto: z.string().optional().nullish(),
        ownerPhoto: z.string().optional().nullish(),
        coverPhoto: z.string().optional().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shop = await ctx.db.shop.findUnique({
        where: { id: input.id },
      });

      if (
        shop?.ownerId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Shop does not belong to current user",
        });
      }

      const updatedShop = await ctx.db.shop.update({
        where: { id: input.id },
        data: {
          name: input.name,
          ownerName: input.ownerName,
          bio: input?.bio ?? "",
          ownerId: input?.ownerId ?? ctx.session.user.id,
          description: input?.description ?? "",
          logoPhoto: input.logoPhoto,
          ownerPhoto: input.ownerPhoto,
          coverPhoto: input.coverPhoto,
          phone: input?.phone ?? "",
          email: input?.email ?? "",
          website: input?.website ?? "",
          attributeTags: input?.attributeTags ?? [],
        },
      });

      await ctx.db.shopAddress.update({
        where: { shopId: input.id },
        data: {
          address: input?.address ?? "",
          city: input?.city ?? "",
          state: input?.state ?? "",
          zip: input?.zip ?? "",
          country: input?.country ?? "",
        },
      });
      return { data: updatedShop, message: "Shop updated successfully" };
    }),

  delete: elevatedProcedure
    .input(z.object({ shopId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const shop = await ctx.db.shop.findUnique({
        where: {
          id: input.shopId,
        },
      });

      if (
        shop?.ownerId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Shop does not belong to current user",
        });
      }

      await ctx.db.shop.delete({
        where: { id: input.shopId },
      });

      return { data: null, message: "Shop deleted successfully" };
    }),
});
