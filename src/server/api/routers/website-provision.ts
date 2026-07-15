import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import { PrismaClient } from "generated/prisma";
import { z } from "zod";

import { sendWebsiteReadyEmail } from "~/lib/email/templates";
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
import {
  checkSimplePressConnection,
  provisionSimplePressSite,
} from "~/server/lib/simplepress-client";

import { adminOnlyProcedure, artisanProcedure, createTRPCRouter } from "../trpc";

const ACCESS_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function generateInviteCode(): string {
  return createId().slice(0, 8).toUpperCase();
}

/**
 * Create the SimplePress `WebsiteProvision` row (framework NEXTJS, siteType
 * BUSINESS) with a unique `accessToken` — the idempotency key sent to SP as
 * `afProvisionCode`. Retries on the `accessToken @unique` collision (P2002).
 * Also stamps `accessTokenExpiresAt` 14 days out (fix B). Shared by the admin
 * `createNextJs` flow and the artisan `requestMySite` flow.
 */
async function createSimplePressProvisionRow(
  db: PrismaClient,
  {
    userId,
    shopId,
    businessName,
    contactEmail,
    contactPhone,
  }: {
    userId: string;
    shopId: string;
    businessName: string;
    contactEmail: string;
    contactPhone?: string;
  },
) {
  let attempts = 0;
  const maxAttempts = 5;

  while (true) {
    const code = generateInviteCode();
    try {
      return await db.websiteProvision.create({
        data: {
          userId,
          shopId,
          framework: "NEXTJS",
          siteType: "BUSINESS",
          status: "PROVISIONING",
          businessName,
          contactEmail,
          contactPhone,
          hasCustomDomain: false,
          accessToken: code,
          accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
          config: {},
        },
      });
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
}

/**
 * UI-safe projection of a provision row. Never exposes `accessToken`,
 * `config`, `adminPasswordEncrypted`, or any Coolify fields.
 */
function toSafeProvision(provision: {
  status: string;
  subdomain: string | null;
  deploymentUrl: string | null;
  claimUrl: string | null;
  claimedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  framework: string;
}) {
  return {
    status: provision.status,
    subdomain: provision.subdomain,
    deploymentUrl: provision.deploymentUrl,
    claimUrl: provision.claimUrl,
    claimedAt: provision.claimedAt,
    errorMessage: provision.errorMessage,
    createdAt: provision.createdAt,
    updatedAt: provision.updatedAt,
    framework: provision.framework,
  };
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
      const shop = await ctx.db.shop.findUnique({
        where: { id: input.shopId },
        select: { id: true, name: true, ownerId: true },
      });

      if (!shop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shop not found",
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

      const provision = await createSimplePressProvisionRow(ctx.db, {
        userId: input.userId,
        shopId: input.shopId,
        businessName: input.businessName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
      });

      return {
        provision,
        redirectUrl: `https://simplepress.dev/platform/signup?aftoken=${provision.accessToken}`,
      };
    }),

  requestMySite: artisanProcedure.mutation(async ({ ctx }) => {
    const shop = await ctx.db.shop.findFirst({
      where: { ownerId: ctx.session.user.id },
      include: { owner: true },
    });

    if (!shop) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "You need a shop before requesting a website.",
      });
    }

    const contactEmail = shop.email ?? shop.owner.email;

    if (!contactEmail) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Your shop needs a contact email before requesting a website.",
      });
    }

    const existingProvision = await ctx.db.websiteProvision.findUnique({
      where: { shopId: shop.id },
    });

    let provision: Awaited<ReturnType<typeof ctx.db.websiteProvision.create>>;

    if (existingProvision) {
      // WordPress/Coolify provisions are admin-managed; never re-dispatch them.
      if (existingProvision.framework !== "NEXTJS") {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Your shop already has a website provision managed by our admins. Contact us if you need changes.",
        });
      }

      // A claimed site is live and owned on SimplePress — nothing to redo.
      if (existingProvision.claimedAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Your website has already been claimed and is live.",
        });
      }

      // Statuses outside the SimplePress request lifecycle (SUSPENDED,
      // DELETING, ...) need an admin.
      const redispatchable = ["FAILED", "PROVISIONING", "ACTIVE", "PENDING"];
      if (!redispatchable.includes(existingProvision.status)) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Your website can't be rebuilt automatically right now. Contact us for help.",
        });
      }

      // Re-dispatch is always safe: SimplePress is idempotent on the
      // accessToken (afProvisionCode), so this either finishes a stale /
      // legacy row (pre-claim-flow rows have no claimUrl) or acts as a
      // "resend claim email" for an ACTIVE-but-unclaimed site.
      provision = await ctx.db.websiteProvision.update({
        where: { id: existingProvision.id },
        data: {
          status: "PROVISIONING",
          errorMessage: null,
          // Legacy rows may have no accessToken — mint one.
          accessToken: existingProvision.accessToken ?? generateInviteCode(),
          accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
        },
      });
    } else {
      provision = await createSimplePressProvisionRow(ctx.db, {
        userId: ctx.session.user.id,
        shopId: shop.id,
        businessName: shop.name,
        contactEmail,
        contactPhone: shop.phone ?? undefined,
      });
    }

    const afProvisionCode = provision.accessToken;
    if (!afProvisionCode) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "We couldn't reach SimplePress to build your site. Please try again in a few minutes.",
      });
    }

    const result = await provisionSimplePressSite({
      afProvisionCode,
      businessName: shop.name,
      email: contactEmail,
      phone: shop.phone ?? undefined,
      logoUrl: shop.logoPhoto ?? undefined,
    });

    if (!result.ok) {
      // Persist the failure, then surface a generic message (no internals).
      await ctx.db.websiteProvision.update({
        where: { id: provision.id },
        data: {
          status: "FAILED",
          errorMessage: result.message,
        },
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "We couldn't reach SimplePress to build your site. Please try again in a few minutes.",
      });
    }

    const { data } = result;

    const updated = await ctx.db.websiteProvision.update({
      where: { id: provision.id },
      data: {
        status: "ACTIVE",
        subdomain: data.subdomain,
        deploymentUrl: data.storefrontUrl,
        claimUrl: data.claimUrl,
        hasCustomDomain: false,
        // Replay of an already-claimed site: stamp claimedAt if not already set.
        ...(data.claimed && provision.claimedAt === null
          ? { claimedAt: new Date() }
          : {}),
      },
    });

    // Fire-and-forget: never fail the mutation on an email error, and skip
    // entirely when there is no claim link (already-claimed replay).
    if (data.claimUrl) {
      void sendWebsiteReadyEmail({
        to: contactEmail,
        businessName: shop.name,
        subdomain: data.subdomain,
        storefrontUrl: data.storefrontUrl,
        claimUrl: data.claimUrl,
        expiresAt: data.claimExpiresAt,
        logoUrl: shop.logoPhoto ?? undefined,
      }).catch((err) =>
        console.error("Failed to send website-ready email:", err),
      );
    }

    return toSafeProvision(updated);
  }),

  getMyProvision: artisanProcedure.query(async ({ ctx }) => {
    const shop = await ctx.db.shop.findFirst({
      where: { ownerId: ctx.session.user.id },
      select: { id: true },
    });

    if (!shop) {
      return null;
    }

    const provision = await ctx.db.websiteProvision.findUnique({
      where: { shopId: shop.id },
    });

    if (!provision) {
      return null;
    }

    return toSafeProvision(provision);
  }),

  // Live AF ↔ SP connectivity/credential check for the /admin/website page.
  // Diagnostic detail is admin-only; artisans just get a boolean.
  checkSimplePressConnection: artisanProcedure.query(async ({ ctx }) => {
    const result = await checkSimplePressConnection();
    return {
      connected: result.connected,
      detail: ctx.session.user.role === "ADMIN" ? result.detail : null,
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
