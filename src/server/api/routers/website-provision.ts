import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createCoolifyDeployment,
  deleteCoolifyDeployment,
  verifyDeployment,
} from "~/lib/coolify";
import {
  cancelProvisionSchema,
  createProvisionSchema,
} from "~/lib/validators/website-provision";
import { generateSecurePassword } from "~/lib/website-provisions/generate-secure-password";
import { generateSimplePressLink } from "~/lib/website-provisions/generate-sp-link";

import { adminOnlyProcedure, createTRPCRouter } from "../trpc";

function generateInviteCode(): string {
  return createId().slice(0, 8).toUpperCase();
}

export const websiteProvisionRouter = createTRPCRouter({
  getShopForProvision: adminOnlyProcedure
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

  create: adminOnlyProcedure
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

        return {
          provision: updateProvision,
          redirectUrl: `https://${coolifyResult.domain}`,
        };
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

  createNextJs: adminOnlyProcedure
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

      let code: string;
      let provision: Awaited<ReturnType<typeof ctx.db.websiteProvision.create>>;
      let attempts = 0;
      const maxAttempts = 5;

      while (true) {
        code = generateInviteCode();
        try {
          provision = await ctx.db.websiteProvision.create({
            data: {
              userId: input.userId,
              shopId: input.shopId,
              framework: input.framework,
              siteType: input.siteType,
              status: "PROVISIONING",
              businessName: input.businessName,
              contactEmail: input.contactEmail,
              hasCustomDomain: false,
              accessToken: code,
              config: {},
            },
            include: { user: true },
          });
          break;
        } catch (err) {
          const isUniqueViolation =
            err &&
            typeof err === "object" &&
            "code" in err &&
            (err as { code?: string }).code === "P2002";
          if (isUniqueViolation && attempts < maxAttempts) {
            attempts++;
            continue;
          }
          throw err;
        }
      }
      return {
        provision,
        redirectUrl: `https://simplepress.dev/verify?code=${code}`,
      };
    }),

  delete: adminOnlyProcedure
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
