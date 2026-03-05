import { TRPCError } from "@trpc/server";
import {
  createCoolifyDeployment,
  deleteCoolifyDeployment,
  verifyDeployment,
} from "~/services/coolify";
import { z } from "zod";

import {
  cancelProvisionSchema,
  createProvisionSchema,
} from "~/lib/validators/website-provision";
import { generateSecurePassword } from "~/lib/website-provisions/generate-secure-password";
import { generateSimplePressLink } from "~/lib/website-provisions/generate-sp-link";

import { adminProcedure, createTRPCRouter } from "../trpc";

export const websiteProvisionRouter = createTRPCRouter({
  getShopForProvision: adminProcedure
    .input(z.object({ shopId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const shop = await ctx.db.shop.findUnique({
        where: { id: input.shopId },
        include: {
          owner: true,
          address: true,
          websiteProvision: true,
        },
      });

      if (!shop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shop not found",
        });
      }

      return {
        shop,
        hasProvision: !!shop.websiteProvision,
        onboardingData: {
          businessName: shop.name,
          ownerName: shop.ownerName,
          contactEmail: shop.email ?? shop.owner.email,
          contactPhone: shop.phone,
          businessAddress: shop.address
            ? {
                street: shop.address.street,
                city: shop.address.city,
                state: shop.address.state,
                zip: shop.address.zip,
                country: shop.address.country,
              }
            : undefined,
          businessTagLine: shop.bio,
          logoUrl: shop.logoPhoto,
          coverUrl: shop.coverPhoto,
          website: shop.website,
        },
      };
    }),

  create: adminProcedure
    .input(createProvisionSchema)
    .mutation(async ({ ctx, input }) => {
      const adminUser = "af_admin";
      const adminPassword = generateSecurePassword();

      if (!adminPassword) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Password could not be generated",
        });
      }

      const existingProvision = await ctx.db.websiteProvision.findUnique({
        where: { shopId: input.shopId },
      });

      if (existingProvision) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This shop already has an active website provision",
        });
      }

      const config = {
        ...input.config,
        adminUser,
        adminPassword,
        adminEmail: input.config?.adminEmail ?? input.contactEmail,
        plugins: input.config?.plugins ?? [
          "woocommerce",
          "better-wp-security",
          "all-in-one-wp-migration",
          "admin-site-enhancements",
        ],
        theme: input.config?.theme ?? "storefront",
      };

      const provision = await ctx.db.websiteProvision.create({
        data: {
          userId: input.userId,
          shopId: input.shopId,
          framework: input.framework,
          siteType: input.siteType,
          status: "PENDING",
          businessName: input.businessName,
          contactEmail: input.contactEmail,
          config: config,
        },
        include: { user: true },
      });

      try {
        const coolifyResult = await createCoolifyDeployment(provision);
        const isLive = await verifyDeployment(
          `https://${coolifyResult.domain}`,
        );

        if (!isLive) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Website deployment failed verification - site is not accessible",
          });
        }

        const updateProvision = await ctx.db.websiteProvision.update({
          where: { id: provision.id },
          data: {
            status: isLive ? "ACTIVE" : "PROVISIONING",
            coolifyProjectUuid: coolifyResult.projectUuid,
            coolifyServiceUuid: coolifyResult.serviceUuid,
            coolifyServerUuid: coolifyResult.serverUuid,
            customDomain: coolifyResult.domain,
            hasCustomDomain: true,
            adminUser: adminUser,
            // adminPasswordEncrypted: encryptedPassword,
          },
          include: { user: true },
        });

        return updateProvision;
      } catch (coolifyError) {
        await ctx.db.websiteProvision.update({
          where: { id: provision.id },
          data: {
            status: "FAILED",
            errorMessage:
              coolifyError instanceof Error
                ? coolifyError.message
                : "Unknown error",
          },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Deployment failed: ${coolifyError instanceof Error ? coolifyError.message : " Unknown"}`,
        });
      }
    }),

  createNextJs: adminProcedure
    .input(createProvisionSchema)
    .mutation(async ({ ctx, input }) => {
      const existingProvision = await ctx.db.websiteProvision.findUnique({
        where: { shopId: input.shopId },
      });

      if (existingProvision) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This shop already has an active website provision",
        });
      }

      const provision = await ctx.db.websiteProvision.create({
        data: {
          userId: input.userId,
          shopId: input.shopId,
          framework: input.framework,
          siteType: input.siteType,
          status: "ACTIVE",
          businessName: input.businessName,
          contactEmail: input.contactEmail,
          subdomain: input.subdomain,
          customDomain: `${input.subdomain}.simplepress.dev`,
          hasCustomDomain: true,

          config: {},
        },
        include: { user: true },
      });

      const redirectUrl = generateSimplePressLink({
        userEmail: input.contactEmail,
        subdomain: input.subdomain ?? "",
      });
      return {
        provision,
        redirectUrl,
      };
    }),

  delete: adminProcedure
    .input(cancelProvisionSchema)
    .mutation(async ({ ctx, input }) => {
      const provision = await ctx.db.websiteProvision.findUnique({
        where: { id: input.id },
      });

      if (!provision) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Provision not found",
        });
      }

      if (provision.coolifyServiceUuid && provision.coolifyProjectUuid) {
        try {
          await deleteCoolifyDeployment(
            provision.coolifyServiceUuid,
            provision.coolifyProjectUuid,
          );
        } catch (coolifyError) {
          console.error("Failed to delete from Coolify:", coolifyError);
        }
      }

      await ctx.db.websiteProvision.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
