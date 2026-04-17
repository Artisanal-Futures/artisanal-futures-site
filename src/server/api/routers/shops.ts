import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { checkUserShopPermissions } from "~/lib/check-user-permissions";
import { shopSchema, shopUpdateSchema } from "~/lib/validators/shop";
import {
  adminArtisanProcedure,
  adminOnlyProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const shopsRouter = createTRPCRouter({
  getAllWithWebsites: protectedProcedure.query(async ({ ctx }) => {
    const shops = ctx.db.shop.findMany({
      include: { siteProvisions: true },
      orderBy: { name: "asc" },
    });
    return shops;
  }),

  getShopOwners: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: { OR: [{ role: "ARTISAN" }, { role: "ADMIN" }] },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return users;
  }),

  getAllPublic: publicProcedure.query(({ ctx }) => {
    return ctx.db.shop.findMany({
      select: {
        id: true,
        name: true,
        ownerName: true,
        bio: true,
        description: true,
        logoPhoto: true,
        ownerPhoto: true,
        website: true,
        email: true,
        phone: true,
        address: true,
        attributeTags: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  getAll: adminArtisanProcedure.query(async ({ ctx }) => {
    const shops = await ctx.db.shop.findMany({
      include: {
        owner: true,
        address: true,
        products: true,
        services: true,
        siteProvisions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (ctx.session.user.role !== "ADMIN") {
      return shops.filter((shop) => shop.ownerId === ctx.session.user.id);
    }

    return shops.map((shop) => ({
      ...shop,
      logoPhoto: `${shop?.logoPhoto}`,
      ownerPhoto: `${shop?.ownerPhoto}`,
    }));
  }),

  getMetrics: adminOnlyProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.count();
    const services = await ctx.db.service.count();
    const websites = await ctx.db.websiteProvision.count();
    const invites = await ctx.db.platformInvite.count();
    const users = await ctx.db.user.count();
    const shops = await ctx.db.shop.count();

    const newArtisansThisMonth = await ctx.db.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      },
    });

    const productsAddedThisWeek = await ctx.db.product.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });

    return {
      products,
      services,
      websites,
      invites,
      users,
      shops,
      newArtisansThisMonth,
      productsAddedThisWeek,
    };
  }),

  get: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: shopId }) => {
      const shop = await ctx.db.shop.findUnique({
        where: { id: shopId },
        include: { address: true, products: true, services: true },
      });

      return shop;
    }),

  create: adminArtisanProcedure
    .input(shopSchema)
    .mutation(async ({ ctx, input }) => {
      const shop = await ctx.db.shop.create({
        data: {
          ownerId: input.ownerId ?? ctx.session.user.id,
          name: input.name,
          ownerName: input.ownerName
            ? input.ownerName
            : (ctx.session.user?.name ?? ""),
          ownerPhoto: input.ownerPhotoUrl,
          bio: input.bio ?? "",
          description: input.description ?? "",
          logoPhoto: input.logoPhotoUrl,
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

  update: adminArtisanProcedure
    .input(shopUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const isUserAuthorized = await checkUserShopPermissions(
        ctx.session,
        input.id,
      );

      if (!isUserAuthorized) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Shop does not belong to current user",
        });
      }

      const updateShopData = await ctx.db.$transaction(async (tx) => {
        const updatedAddress = await tx.shopAddress.update({
          where: { shopId: input.id },
          data: {
            address: input?.address ?? "",
            city: input?.city ?? "",
            state: input?.state ?? "",
            zip: input?.zip ?? "",
            country: input?.country ?? "",
          },
        });

        const updatedShop = await tx.shop.update({
          where: { id: input.id },
          data: {
            ownerId: input?.ownerId ?? ctx.session.user.id,

            name: input.name,
            ownerName: input.ownerName,
            ownerPhoto: input.ownerPhotoUrl,
            bio: input?.bio ?? "",
            description: input?.description ?? "",
            logoPhoto: input.logoPhotoUrl,
            phone: input?.phone ?? "",
            email: input?.email ?? "",
            website: input?.website ?? "",
            attributeTags: input?.attributeTags ?? [],
          },
        });

        return {
          updatedShop,
          updatedAddress,
        };
      });

      return {
        data: {
          ...updateShopData.updatedShop,
          address: updateShopData.updatedAddress.address,
          city: updateShopData.updatedAddress.city,
          state: updateShopData.updatedAddress.state,
          zip: updateShopData.updatedAddress.zip,
          country: updateShopData.updatedAddress.country,
        },
        message: "Shop updated successfully",
      };
    }),

  delete: adminArtisanProcedure
    .input(z.object({ shopId: z.string() }))
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

      await ctx.db.shop.delete({
        where: { id: input.shopId },
      });

      return { data: null, message: "Shop deleted successfully" };
    }),

  getWelcomeShop: adminArtisanProcedure.query(async ({ ctx }) => {
    const shop = await ctx.db.shop.findFirst({
      where: { ownerId: ctx.session.user.id },
      include: { products: true, services: true, siteProvisions: true },
      orderBy: { createdAt: "desc" },
    });

    const survey = await ctx.db.artisanSurvey.findFirst({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const data = {
      shop,

      completedSurvey: survey ? true : false,
      hasProducts: (shop?.products?.length ?? 0 > 0) ? true : false,
      hasServices: (shop?.services?.length ?? 0 > 0) ? true : false,
      hasHostedWebsite: (shop?.siteProvisions?.length ?? 0) > 0 ? true : false,
    };

    return data;
  }),
});
