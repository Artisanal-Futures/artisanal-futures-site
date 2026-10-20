import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import { PrismaClient } from "generated/prisma";
import { z } from "zod";

import { sendWebsiteReadyEmail } from "~/lib/email/templates";
import { deleteCoolifyDeployment } from "~/lib/coolify";
import { cancelProvisionSchema } from "~/lib/validators/website-provision";
import {
  checkSimplePressConnection,
  provisionSimplePressSite,
} from "~/server/lib/simplepress-client";
import { toPublicAddress } from "~/server/lib/public-address";

import { adminOnlyProcedure, artisanProcedure, createTRPCRouter } from "../trpc";

const ACCESS_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function generateInviteCode(): string {
  return createId().slice(0, 8).toUpperCase();
}

/**
 * Create the SimplePress `WebsiteProvision` row (framework NEXTJS, siteType
 * BUSINESS) with a unique `accessToken` — the idempotency key sent to SP as
 * `afProvisionCode`. Retries on the `accessToken @unique` collision (P2002).
 * Also stamps `accessTokenExpiresAt` 14 days out (fix B). Dispatch core for
 * the artisan/admin `requestMySite` flow.
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

/**
 * Resolve the shop a caller may act on, including its `owner`.
 *
 * - `shopId` provided → look it up; NOT_FOUND if missing, FORBIDDEN unless the
 *   caller owns it or is an ADMIN (admins may act on ANY shop).
 * - `shopId` omitted → the caller's own single shop (keeps the page working for
 *   single-shop artisans before/without a picker); NOT_FOUND if they have none.
 */
async function resolveShopForCaller(
  db: PrismaClient,
  user: { id: string; role: string },
  shopId?: string,
) {
  if (shopId) {
    const shop = await db.shop.findUnique({
      where: { id: shopId },
      include: { owner: true },
    });

    if (!shop) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Shop not found" });
    }

    if (shop.ownerId !== user.id && user.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You don't have access to this shop.",
      });
    }

    return shop;
  }

  const shop = await db.shop.findFirst({
    where: { ownerId: user.id },
    include: { owner: true },
  });

  if (!shop) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "You need a shop before requesting a website.",
    });
  }

  return shop;
}

export const websiteProvisionRouter = createTRPCRouter({
  getShopForProvision: adminOnlyProcedure
    .input(z.object({ shopId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const shop = await ctx.db.shop.findUnique({
        where: { id: input.shopId },
        // Narrow `select` on purpose: this goes to the admin browser, so never
        // pull the owner row or the full provision (tokens, config, passwords,
        // Coolify ids).
        select: {
          name: true,
          ownerName: true,
          email: true,
          phone: true,
          bio: true,
          logoPhoto: true,
          coverPhoto: true,
          website: true,
          owner: { select: { email: true } },
          locationType: true,
          address: {
            select: {
              address: true,
              additional: true,
              street: true,
              city: true,
              state: true,
              zip: true,
              country: true,
            },
          },
          websiteProvision: { select: { status: true } },
        },
      });

      if (!shop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shop not found",
        });
      }

      // This prefills a public website, so it follows the storefront rule:
      // only a STOREFRONT's street line leaves the platform.
      const address = toPublicAddress(shop.address, shop.locationType);

      return {
        shop: {
          websiteProvision: shop.websiteProvision
            ? { status: shop.websiteProvision.status }
            : null,
        },
        hasProvision: !!shop.websiteProvision,
        onboardingData: {
          businessName: shop.name,
          ownerName: shop.ownerName,
          contactEmail: shop.email ?? shop.owner.email,
          contactPhone: shop.phone,
          businessAddress: address
            ? {
                // The form's "Street Address" is stored in `address`; the
                // legacy `street` column is a fallback.
                street: address.address?.trim() ? address.address : address.street,
                city: address.city,
                state: address.state,
                zip: address.zip,
                country: address.country,
              }
            : undefined,
          businessTagLine: shop.bio,
          logoUrl: shop.logoPhoto,
          coverUrl: shop.coverPhoto,
          website: shop.website,
        },
      };
    }),

  // Shops the caller may act on, for pickers. ADMIN → all shops; otherwise the
  // caller's own. Lightweight projection + a provision status hint; no tokens.
  listMyShops: artisanProcedure.query(async ({ ctx }) => {
    return ctx.db.shop.findMany({
      where:
        ctx.session.user.role === "ADMIN"
          ? {}
          : { ownerId: ctx.session.user.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        logoPhoto: true,
        websiteProvision: {
          select: { status: true, claimedAt: true },
        },
      },
    });
  }),

  requestMySite: artisanProcedure
    .input(
      z
        .object({
          shopId: z.string().cuid().optional(),
          contactEmailOverride: z.string().email().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const shop = await resolveShopForCaller(
        ctx.db,
        ctx.session.user,
        input?.shopId,
      );

      // Admins may override the contact email when provisioning on behalf of a
      // store; artisans never can.
      const contactEmailOverride = input?.contactEmailOverride;
      if (contactEmailOverride && ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can override the contact email.",
        });
      }

      // Shop fields are often saved as empty strings (not NULL) by profile
      // forms, so normalize before falling back to the owner's account email.
      const nonEmpty = (value: string | null | undefined) => {
        const trimmed = value?.trim();
        // NOT `??`: an empty string must also become undefined, which nullish
        // coalescing would pass through.
        return trimmed === undefined || trimmed === "" ? undefined : trimmed;
      };

      const contactEmail =
        nonEmpty(contactEmailOverride) ??
        nonEmpty(shop.email) ??
        nonEmpty(shop.owner.email);

      if (!contactEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "We couldn't find an email for your shop or your account. Add a contact email to your shop profile and try again.",
        });
      }

      const existingProvision = await ctx.db.websiteProvision.findUnique({
        where: { shopId: shop.id },
      });

      let provision: Awaited<
        ReturnType<typeof ctx.db.websiteProvision.create>
      >;

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
            // Persist the resolved contact email so an admin override sticks
            // and is visible in the admin table.
            contactEmail,
            // Legacy rows may have no accessToken — mint one.
            accessToken: existingProvision.accessToken ?? generateInviteCode(),
            accessTokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
          },
        });
      } else {
        provision = await createSimplePressProvisionRow(ctx.db, {
          userId: shop.ownerId,
          shopId: shop.id,
          businessName: shop.name,
          contactEmail,
          contactPhone: nonEmpty(shop.phone),
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
        phone: nonEmpty(shop.phone),
        logoUrl: nonEmpty(shop.logoPhoto),
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
          logoUrl: nonEmpty(shop.logoPhoto),
        }).catch((err) =>
          console.error("Failed to send website-ready email:", err),
        );
      }

      return toSafeProvision(updated);
    }),

  getMyProvision: artisanProcedure
    .input(z.object({ shopId: z.string().cuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const shop = await resolveShopForCaller(
        ctx.db,
        ctx.session.user,
        input?.shopId,
      );

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
