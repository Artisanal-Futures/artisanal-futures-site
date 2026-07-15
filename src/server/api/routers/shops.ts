import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { checkUserShopPermissions } from "~/lib/check-user-permissions";
import { shopSchema, shopUpdateSchema } from "~/lib/validators/shop";
import {
  adminArtisanProcedure,
  adminOnlyProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const shopsRouter = createTRPCRouter({
  getAllWithWebsites: adminOnlyProcedure.query(async ({ ctx }) => {
    const shops = ctx.db.shop.findMany({
      include: { websiteProvision: true },
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
      where: { isPublic: true },
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
        websiteProvision: true,
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

      // Public storefront reads go through this procedure, so it stays public.
      // But a non-public shop (with its contact fields) must only be readable by
      // its owner or an admin — otherwise anyone can enumerate hidden shops by id.
      if (shop && !shop.isPublic) {
        const isOwnerOrAdmin =
          ctx.session?.user?.role === "ADMIN" ||
          (!!ctx.session?.user?.id && shop.ownerId === ctx.session.user.id);

        if (!isOwnerOrAdmin) {
          return null;
        }
      }

      return shop;
    }),

  create: adminArtisanProcedure
    .input(shopSchema)
    .mutation(async ({ ctx, input }) => {
      const shop = await ctx.db.shop.create({
        data: {
          ownerId:
            ctx.session.user.role === "ADMIN"
              ? (input.ownerId ?? ctx.session.user.id)
              : ctx.session.user.id,
          name: input.name,
          ownerName: input.ownerName
            ? input.ownerName
            : (ctx.session.user?.name ?? ""),
          ownerPhoto: input.ownerPhotoUrl,
          bio: input.bio ?? "",
          description: input.description ?? "",
          logoPhoto: input.logoPhotoUrl,
          attributeTags: input.attributeTags ?? [],
          isPublic: input.isPublic,
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
        const addressData = {
          address: input?.address ?? "",
          city: input?.city ?? "",
          state: input?.state ?? "",
          zip: input?.zip ?? "",
          country: input?.country ?? "",
        };

        const updatedAddress = await tx.shopAddress.upsert({
          where: { shopId: input.id },
          create: { ...addressData, shopId: input.id },
          update: addressData,
        });

        const updatedShop = await tx.shop.update({
          where: { id: input.id },
          data: {
            ...(ctx.session.user.role === "ADMIN" && input.ownerId
              ? { ownerId: input.ownerId }
              : {}),

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
            isPublic: input?.isPublic,
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

  deleteMany: adminArtisanProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input: shopIds }) => {
      if (ctx.session.user.role !== "ADMIN") {
        // Non-admin users may only delete shops they own
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { shops: { select: { id: true } } },
        });
        const ownedIds = new Set(user?.shops.map((s) => s.id) ?? []);
        const unauthorized = shopIds.find((id) => !ownedIds.has(id));
        if (unauthorized) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "One or more shops do not belong to current user",
          });
        }
      }

      await ctx.db.shop.deleteMany({
        where: { id: { in: shopIds } },
      });

      return { data: null, message: `${shopIds.length} shop(s) deleted successfully` };
    }),

  getWelcomeShop: adminArtisanProcedure.query(async ({ ctx }) => {
    const shop = await ctx.db.shop.findFirst({
      where: { ownerId: ctx.session.user.id },
      include: { products: true, services: true, websiteProvision: true },
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
      hasHostedWebsite: shop?.websiteProvision ? true : false,
    };

    return data;
  }),
});
