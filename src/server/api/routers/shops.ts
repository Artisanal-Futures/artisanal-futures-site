import type { PrismaClient, Role } from "generated/prisma";
import { TRPCError } from "@trpc/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import type { ShopSeoValues } from "~/lib/validators/seo";
import type { MapShopLocation } from "~/server/geocoding/approximate-location";
import { checkUserShopPermissions } from "~/lib/check-user-permissions";
import { shopPath } from "~/lib/seo/paths";
import { shopSchema, shopUpdateSchema } from "~/lib/validators/shop";
import { shopPrivateContactSchema } from "~/lib/validators/shop-private-contact";
import {
  adminArtisanProcedure,
  adminOnlyProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import {
  blankToNull,
  formatLocality,
  offsetLocation,
} from "~/server/geocoding/approximate-location";
import { syncShopCoordinates } from "~/server/geocoding/geocode-shop-address";
import { pingIndexNow } from "~/server/seo/indexnow";
import { SHOPS_LANDING_TAG } from "~/server/seo/landing-pages";
import { generateUniqueShopSlug, RESERVED_SLUGS } from "~/server/seo/shop-slug";

/**
 * Public address select. Deliberately lists only the original columns so the
 * raw geocoding columns (latitude, longitude, geocodeQuery, geocodedAt) never
 * leak through public endpoints. The map uses `getMapLocations`, which
 * returns jittered coordinates only.
 */
const publicAddressSelect = {
  id: true,
  address: true,
  additional: true,
  city: true,
  state: true,
  zip: true,
  country: true,
  street: true,
  shopId: true,
} as const;

/**
 * Admin-only private contact select. `ShopPrivateContact` must only ever be
 * selected explicitly, and only from adminOnlyProcedure routes.
 */
const privateContactSelect = {
  name: true,
  email: true,
  phone: true,
  notes: true,
  updatedAt: true,
} as const;

/** One row of the admin Artisan Directory: a shop, or an artisan with no shop. */
export type DirectoryRow = {
  /** shop.id, or `user_${user.id}` for shopless artisans */
  id: string;
  kind: "shop" | "no-shop";
  shopId: string | null;
  shopName: string | null;
  logoPhoto: string | null;
  contactName: string;
  contactEmail: string | null;
  shopEmail: string | null;
  accountEmail: string | null;
  phone: string | null;
  website: string | null;
  isPublic: boolean | null;
  location: string | null;
  address: {
    address: string | null;
    additional: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
  } | null;
  owner: { id: string; name: string | null; email: string | null; role: Role };
  createdAt: Date;
  /** Admin-only private contact for the real artisan behind an admin-owned shop. */
  privateContact: {
    name: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
    updatedAt: Date;
  } | null;
  /** True when the shop is owned by an ADMIN account (artisan has no account). */
  managedByAdmin: boolean;
  /** Latest unused, unexpired invite for this shop, if any. */
  pendingInvite: { email: string; expiresAt: Date } | null;
  /** privateContact.phone ?? phone */
  contactPhone: string | null;
};

type ShopDb = Pick<PrismaClient, "shop">;

/**
 * Validates an admin-requested slug for `shopId` (null for a new shop). It must
 * not be another shop's current or previous slug, nor another shop's id, since
 * /shops/{x} resolves slugs before ids.
 */
async function assertSlugAvailable(
  db: ShopDb,
  slug: string,
  shopId: string | null,
) {
  if (RESERVED_SLUGS.has(slug)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `"${slug}" is reserved. Choose another slug.`,
    });
  }

  const taken = await db.shop.findFirst({
    where: {
      OR: [{ slug }, { previousSlugs: { has: slug } }, { id: slug }],
      ...(shopId ? { NOT: { id: shopId } } : {}),
    },
    select: { name: true },
  });

  if (taken) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `The URL /shops/${slug} is already used by ${taken.name}.`,
    });
  }
}

/**
 * Every URL a shop has answered on (current slug, then old slugs) for IndexNow.
 * Old slugs 404 once the shop is deleted, so they are pinged too.
 */
/**
 * A public shop was added, changed or removed: refresh the cached tag/location
 * landing pages and tell IndexNow engines about the affected URLs.
 */
function publicShopsChanged(paths: string[]) {
  revalidateTag(SHOPS_LANDING_TAG);
  pingIndexNow(paths);
}

function shopUrlPaths(shop: {
  id: string;
  slug: string | null;
  previousSlugs: string[];
}) {
  return [
    shopPath(shop),
    ...shop.previousSlugs.map((slug) => shopPath({ id: shop.id, slug })),
  ];
}

/** Admin-only search/share columns, from the validated `seo` input. */
function seoFields(seo: ShopSeoValues) {
  return {
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
    seoImage: seo.seoImageUrl,
    seoNoIndex: seo.seoNoIndex,
  };
}

/**
 * The slug, search and share fields are admin-only. They travel in `input.seo`
 * on create/update so the form saves in one request; any non-admin request
 * that carries them is rejected outright rather than silently stripped.
 */
function assertCanEditSeo(role: string, seo: ShopSeoValues | undefined) {
  if (seo && role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can change a shop's URL or search settings",
    });
  }
}

/**
 * Turns the P2002 a concurrent save hits on the slug unique index into the
 * same CONFLICT the availability check gives; rethrows anything else.
 */
function rethrowSlugConflict(error: unknown): never {
  if ((error as { code?: string } | null)?.code === "P2002") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "That shop URL was just taken. Choose another slug.",
    });
  }
  throw error;
}

/** One row of the /admin/seo shop health table. */
export type ShopSeoHealthRow = {
  id: string;
  name: string;
  slug: string | null;
  isPublic: boolean;
  score: number;
  total: number;
  /** Labels of the failed checks. */
  missing: string[];
};

const MIN_DESCRIPTION_LENGTH = 80;

export const shopsRouter = createTRPCRouter({
  getAllWithWebsites: adminOnlyProcedure.query(async ({ ctx }) => {
    const shops = ctx.db.shop.findMany({
      include: { websiteProvision: true },
      orderBy: { name: "asc" },
    });
    return shops;
  }),

  getPrivateContact: adminOnlyProcedure
    .input(z.string())
    .query(async ({ ctx, input: shopId }) => {
      return ctx.db.shopPrivateContact.findUnique({
        where: { shopId },
        select: privateContactSelect,
      });
    }),

  upsertPrivateContact: adminOnlyProcedure
    .input(shopPrivateContactSchema)
    .mutation(async ({ ctx, input }) => {
      const shop = await ctx.db.shop.findUnique({
        where: { id: input.shopId },
        select: { id: true },
      });

      if (!shop) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shop not found" });
      }

      const fields = {
        name: blankToNull(input.name),
        email: blankToNull(input.email),
        phone: blankToNull(input.phone),
        notes: blankToNull(input.notes),
      };

      if (Object.values(fields).every((value) => value === null)) {
        await ctx.db.shopPrivateContact.deleteMany({
          where: { shopId: input.shopId },
        });
        return null;
      }

      const updatedById = ctx.session.user.id;

      return ctx.db.shopPrivateContact.upsert({
        where: { shopId: input.shopId },
        create: { shopId: input.shopId, ...fields, updatedById },
        update: { ...fields, updatedById },
        select: privateContactSelect,
      });
    }),

  getDirectory: adminOnlyProcedure.query(
    async ({ ctx }): Promise<DirectoryRow[]> => {
      const [shops, shoplessArtisans] = await Promise.all([
        ctx.db.shop.findMany({
          select: {
            id: true,
            name: true,
            ownerName: true,
            email: true,
            phone: true,
            website: true,
            isPublic: true,
            logoPhoto: true,
            createdAt: true,
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
            owner: {
              select: { id: true, name: true, email: true, role: true },
            },
            privateContact: { select: privateContactSelect },
            invites: {
              where: { used: false, expiresAt: { gt: new Date() } },
              select: { email: true, expiresAt: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { name: "asc" },
        }),
        ctx.db.user.findMany({
          where: { role: "ARTISAN", shops: { none: {} } },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { name: "asc" },
        }),
      ]);

      const shopRows: DirectoryRow[] = shops.map((shop) => {
        const shopEmail = blankToNull(shop.email);
        const accountEmail = blankToNull(shop.owner.email);
        const managedByAdmin = shop.owner.role === "ADMIN";
        const privateContact = shop.privateContact
          ? {
              name: blankToNull(shop.privateContact.name),
              email: blankToNull(shop.privateContact.email),
              phone: blankToNull(shop.privateContact.phone),
              notes: blankToNull(shop.privateContact.notes),
              updatedAt: shop.privateContact.updatedAt,
            }
          : null;
        const phone = blankToNull(shop.phone);
        const invite = shop.invites[0];

        return {
          id: shop.id,
          kind: "shop",
          shopId: shop.id,
          shopName: blankToNull(shop.name),
          logoPhoto: blankToNull(shop.logoPhoto),
          contactName:
            privateContact?.name ??
            blankToNull(shop.ownerName) ??
            blankToNull(shop.owner.name) ??
            "",
          contactEmail:
            privateContact?.email ??
            (managedByAdmin ? null : accountEmail) ??
            shopEmail,
          shopEmail,
          accountEmail,
          phone,
          website: blankToNull(shop.website),
          isPublic: shop.isPublic,
          location: formatLocality(shop.address?.city, shop.address?.state),
          address: shop.address
            ? {
                address: blankToNull(shop.address.address),
                additional: blankToNull(shop.address.additional),
                street: blankToNull(shop.address.street),
                city: blankToNull(shop.address.city),
                state: blankToNull(shop.address.state),
                zip: blankToNull(shop.address.zip),
                country: blankToNull(shop.address.country),
              }
            : null,
          owner: shop.owner,
          createdAt: shop.createdAt,
          privateContact,
          managedByAdmin,
          pendingInvite: invite
            ? { email: invite.email, expiresAt: invite.expiresAt }
            : null,
          contactPhone: privateContact?.phone ?? phone,
        };
      });

      const noShopRows: DirectoryRow[] = shoplessArtisans.map((user) => {
        const accountEmail = blankToNull(user.email);

        return {
          id: `user_${user.id}`,
          kind: "no-shop",
          shopId: null,
          shopName: null,
          logoPhoto: null,
          contactName: blankToNull(user.name) ?? "",
          contactEmail: accountEmail,
          shopEmail: null,
          accountEmail,
          phone: null,
          website: null,
          isPublic: null,
          location: null,
          address: null,
          owner: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          createdAt: user.createdAt,
          privateContact: null,
          managedByAdmin: false,
          pendingInvite: null,
          contactPhone: null,
        };
      });

      return [...shopRows, ...noShopRows];
    },
  ),

  getShopOwners: adminOnlyProcedure.query(async ({ ctx }) => {
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
        slug: true,
        name: true,
        ownerName: true,
        bio: true,
        description: true,
        logoPhoto: true,
        ownerPhoto: true,
        website: true,
        email: true,
        phone: true,
        address: { select: publicAddressSelect },
        attributeTags: true,
        createdAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  getMapLocations: publicProcedure.query(
    async ({ ctx }): Promise<MapShopLocation[]> => {
      const shops = await ctx.db.shop.findMany({
        where: { isPublic: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          ownerName: true,
          logoPhoto: true,
          ownerPhoto: true,
          website: true,
          email: true,
          phone: true,
          attributeTags: true,
          // Only locality + coordinates: never street/zip/geocodeQuery.
          address: {
            select: {
              city: true,
              state: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      });

      return shops.map((shop) => {
        const { latitude, longitude } = shop.address ?? {};
        const hasCoordinates =
          typeof latitude === "number" &&
          typeof longitude === "number" &&
          Number.isFinite(latitude) &&
          Number.isFinite(longitude);

        return {
          id: shop.id,
          slug: shop.slug,
          name: shop.name.trim(),
          ownerName: shop.ownerName.trim(),
          logoPhoto: blankToNull(shop.logoPhoto),
          ownerPhoto: blankToNull(shop.ownerPhoto),
          website: blankToNull(shop.website),
          email: blankToNull(shop.email),
          phone: blankToNull(shop.phone),
          attributeTags: shop.attributeTags.filter(
            (tag) => blankToNull(tag) !== null,
          ),
          locality: formatLocality(shop.address?.city, shop.address?.state),
          location: hasCoordinates
            ? offsetLocation(shop.id, latitude, longitude)
            : null,
        };
      });
    },
  ),

  getAll: adminArtisanProcedure.query(async ({ ctx }) => {
    return ctx.db.shop.findMany({
      where:
        ctx.session.user.role === "ADMIN"
          ? {}
          : { ownerId: ctx.session.user.id },
      include: {
        owner: true,
        address: true,
        products: true,
        services: true,
        websiteProvision: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Slim shop list for dropdowns and filters. Same role scoping as `getAll`
   * (admins: every shop; artisans: shops they own) without the heavy relations.
   */
  getOptions: adminArtisanProcedure.query(async ({ ctx }) => {
    return ctx.db.shop.findMany({
      where:
        ctx.session.user.role === "ADMIN"
          ? {}
          : { ownerId: ctx.session.user.id },
      select: { id: true, name: true, logoPhoto: true, ownerId: true },
      orderBy: { name: "asc" },
    });
  }),

  getMetrics: adminOnlyProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const sevenDaysFromNow = new Date(
      new Date().setDate(new Date().getDate() + 7),
    );

    const [
      products,
      services,
      websites,
      invites,
      users,
      shops,
      newArtisansThisMonth,
      productsAddedThisWeek,
      // "Needs attention" counts — actionable items for a platform admin.
      pendingProvisions,
      failedProvisions,
      expiringInvites,
      shopsWithoutProducts,
      hiddenShops,
    ] = await Promise.all([
      ctx.db.product.count(),
      ctx.db.service.count(),
      ctx.db.websiteProvision.count(),
      ctx.db.platformInvite.count(),
      ctx.db.user.count(),
      ctx.db.shop.count(),
      ctx.db.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
        },
      }),
      ctx.db.product.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      }),
      ctx.db.websiteProvision.count({
        where: {
          status: { in: ["PENDING", "PROVISIONING", "BUILDING", "DEPLOYING"] },
        },
      }),
      ctx.db.websiteProvision.count({ where: { status: "FAILED" } }),
      ctx.db.platformInvite.count({
        where: { used: false, expiresAt: { gt: now, lte: sevenDaysFromNow } },
      }),
      ctx.db.shop.count({ where: { products: { none: {} } } }),
      ctx.db.shop.count({ where: { isPublic: false } }),
    ]);

    return {
      products,
      services,
      websites,
      invites,
      users,
      shops,
      newArtisansThisMonth,
      productsAddedThisWeek,
      pendingProvisions,
      failedProvisions,
      expiringInvites,
      shopsWithoutProducts,
      hiddenShops,
    };
  }),

  /**
   * Every shop scored on the profile signals search engines and answer
   * engines use, worst first, for the /admin/seo health table.
   */
  getSeoHealth: adminOnlyProcedure.query(
    async ({ ctx }): Promise<ShopSeoHealthRow[]> => {
      const shops = await ctx.db.shop.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          bio: true,
          logoPhoto: true,
          coverPhoto: true,
          website: true,
          socialLinks: true,
          seoNoIndex: true,
          isPublic: true,
          address: { select: { city: true, state: true } },
          _count: {
            select: {
              products: { where: { isPublic: true } },
              services: { where: { isPublic: true } },
            },
          },
        },
      });

      const rows = shops.map((shop) => {
        const checks: [label: string, passed: boolean][] = [
          [
            "Description",
            (blankToNull(shop.description)?.length ?? 0) >=
              MIN_DESCRIPTION_LENGTH,
          ],
          ["Bio", !!blankToNull(shop.bio)],
          ["Logo", !!blankToNull(shop.logoPhoto)],
          ["Cover photo", !!blankToNull(shop.coverPhoto)],
          [
            "City & state",
            !!blankToNull(shop.address?.city) &&
              !!blankToNull(shop.address?.state),
          ],
          ["Website", !!blankToNull(shop.website)],
          ["Social links", shop.socialLinks.length > 0],
          ["Public items", shop._count.products + shop._count.services > 0],
          ["Indexable", !shop.seoNoIndex],
          ["Public", shop.isPublic],
        ];

        return {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          isPublic: shop.isPublic,
          score: checks.filter(([, passed]) => passed).length,
          total: checks.length,
          missing: checks
            .filter(([, passed]) => !passed)
            .map(([label]) => label),
        };
      });

      return rows.sort(
        (a, b) => a.score - b.score || a.name.localeCompare(b.name),
      );
    },
  ),

  /**
   * A shop by slug or id. Public storefront URLs carry the slug (or, for old
   * links, a previous slug or the id); admin pages pass the id. Resolved in
   * that order: current slug, previous slug, id. The page compares the param
   * with `shop.slug` to decide whether to redirect to the canonical URL.
   */
  get: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input: slugOrId }) => {
      // One query for all three lookups; the priority is applied below.
      const matches = await ctx.db.shop.findMany({
        where: {
          OR: [
            { slug: slugOrId },
            { previousSlugs: { has: slugOrId } },
            { id: slugOrId },
          ],
        },
        include: { address: { select: publicAddressSelect } },
        take: 3,
      });

      const shop =
        matches.find((match) => match.slug === slugOrId) ??
        matches.find((match) => match.previousSlugs.includes(slugOrId)) ??
        matches.find((match) => match.id === slugOrId);

      if (!shop) return null;
      const shopId = shop.id;

      // Public storefront reads go through this procedure, so it stays public.
      // But a non-public shop (with its contact fields) must only be readable by
      // its owner or an admin — otherwise anyone can enumerate hidden shops by id.
      const isOwnerOrAdmin =
        ctx.session?.user?.role === "ADMIN" ||
        (!!ctx.session?.user?.id && shop.ownerId === ctx.session.user.id);

      if (!shop.isPublic && !isOwnerOrAdmin) {
        return null;
      }

      // Products and services carry their own `isPublic` flag, and it has to be
      // honoured here too. These used to be loaded with a bare `products: true`
      // include, so every hidden item on a *public* shop was rendered on the
      // storefront at /shops/[slug] for anyone — while the same items were
      // correctly excluded from browse and search, which do filter on isPublic.
      //
      // Owners and admins still see everything, so they can preview; the page
      // tells them which items visitors cannot see.
      const visibility = isOwnerOrAdmin ? {} : { isPublic: true };

      const [products, services] = await Promise.all([
        ctx.db.product.findMany({
          where: { shopId, ...visibility },
          orderBy: { name: "asc" },
          include: { categories: { select: { name: true } } },
        }),
        ctx.db.service.findMany({
          where: { shopId, ...visibility },
          orderBy: { name: "asc" },
          include: { categories: { select: { name: true } } },
        }),
      ]);

      const hiddenItemCount = isOwnerOrAdmin
        ? products.filter((product) => !product.isPublic).length +
          services.filter((service) => !service.isPublic).length
        : 0;

      return { ...shop, products, services, hiddenItemCount };
    }),

  create: adminArtisanProcedure
    .input(shopSchema)
    .mutation(async ({ ctx, input }) => {
      assertCanEditSeo(ctx.session.user.role, input.seo);

      // An admin may pick the slug up front; otherwise derive it from the name.
      const requestedSlug = blankToNull(input.seo?.slug);
      if (requestedSlug) await assertSlugAvailable(ctx.db, requestedSlug, null);
      const slug =
        requestedSlug ?? (await generateUniqueShopSlug(ctx.db, input.name));

      const shop = await ctx.db.shop
        .create({
          data: {
            slug,
            ...(input.seo ? seoFields(input.seo) : {}),
            ownerId:
              ctx.session.user.role === "ADMIN"
                ? // "" (unselected owner) is not nullish, so test truthiness.
                  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                  input.ownerId || ctx.session.user.id
                : ctx.session.user.id,
            name: input.name,
            ownerName: input.ownerName
              ? input.ownerName
              : (ctx.session.user?.name ?? ""),
            ownerPhoto: input.ownerPhotoUrl,
            bio: input.bio ?? "",
            description: input.description ?? "",
            logoPhoto: input.logoPhotoUrl,
            coverPhoto: input.coverPhotoUrl,
            socialLinks: input.socialLinks ?? [],
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
        })
        .catch(rethrowSlugConflict);

      if (shop.isPublic) publicShopsChanged([shopPath(shop), "/shops"]);

      // Approximate map pin from zip/city/state/country. Best-effort: a
      // geocoding failure must never fail the save.
      try {
        await syncShopCoordinates(ctx.db, shop.id);
      } catch (error) {
        console.error(`Failed to geocode shop ${shop.id}:`, error);
      }

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
          code: "FORBIDDEN",
          message: "Shop does not belong to current user",
        });
      }

      assertCanEditSeo(ctx.session.user.role, input.seo);

      const updateShopData = await ctx.db
        .$transaction(async (tx) => {
          const current = await tx.shop.findUniqueOrThrow({
            where: { id: input.id },
            select: { slug: true, previousSlugs: true, isPublic: true },
          });

          // Slugs never follow a rename; they only change when an admin edits
          // one. The old slug moves to previousSlugs so its links keep
          // redirecting. A shop without one (pre-backfill) gets one here.
          let slugData: { slug?: string; previousSlugs?: string[] } = {};
          const requestedSlug = input.seo?.slug;
          if (requestedSlug && requestedSlug !== current.slug) {
            await assertSlugAvailable(tx, requestedSlug, input.id);
            slugData = {
              slug: requestedSlug,
              previousSlugs: [
                ...current.previousSlugs.filter(
                  (previous) =>
                    previous !== requestedSlug && previous !== current.slug,
                ),
                ...(current.slug ? [current.slug] : []),
              ],
            };
          } else if (!current.slug) {
            slugData = {
              slug: await generateUniqueShopSlug(tx, input.name, input.id),
            };
          }

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

              ...slugData,
              ...(input.seo ? seoFields(input.seo) : {}),

              name: input.name,
              ownerName: input.ownerName,
              ownerPhoto: input.ownerPhotoUrl,
              bio: input?.bio ?? "",
              description: input?.description ?? "",
              logoPhoto: input.logoPhotoUrl,
              coverPhoto: input.coverPhotoUrl,
              socialLinks: input.socialLinks,
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
            previousShop: current,
          };
        })
        .catch(rethrowSlugConflict);

      // Hidden before and after means nothing public changed. Otherwise ping the
      // new URL and the old one (deduped when unchanged) so engines see the redirect.
      if (
        updateShopData.previousShop.isPublic ||
        updateShopData.updatedShop.isPublic
      ) {
        publicShopsChanged([
          shopPath(updateShopData.updatedShop),
          shopPath({
            id: input.id,
            slug: updateShopData.previousShop.slug,
          }),
          "/shops",
        ]);
      }

      // Outside the transaction so a slow geocoder never holds it open, and
      // best-effort so a geocoding failure never fails the save.
      try {
        await syncShopCoordinates(ctx.db, input.id);
      } catch (error) {
        console.error(`Failed to geocode shop ${input.id}:`, error);
      }

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
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const isUserAuthorized = await checkUserShopPermissions(
        ctx.session,
        input.id,
      );

      if (!isUserAuthorized) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Shop does not belong to current user",
        });
      }

      const deletedShop = await ctx.db.shop.delete({
        where: { id: input.id },
      });

      if (deletedShop.isPublic) {
        publicShopsChanged([...shopUrlPaths(deletedShop), "/shops"]);
      }

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
            code: "FORBIDDEN",
            message: "One or more shops do not belong to current user",
          });
        }
      }

      // Read the public shops before deleting; their rows are gone afterwards.
      const publicShops = await ctx.db.shop.findMany({
        where: { id: { in: shopIds }, isPublic: true },
        select: { id: true, slug: true, previousSlugs: true },
      });

      await ctx.db.shop.deleteMany({
        where: { id: { in: shopIds } },
      });

      if (publicShops.length > 0) {
        publicShopsChanged([...publicShops.flatMap(shopUrlPaths), "/shops"]);
      }

      return {
        data: null,
        message: `${shopIds.length} shop(s) deleted successfully`,
      };
    }),

  getWelcomeShop: adminArtisanProcedure.query(async ({ ctx }) => {
    const shop = await ctx.db.shop.findFirst({
      where: { ownerId: ctx.session.user.id },
      include: {
        websiteProvision: true,
        _count: { select: { products: true, services: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const survey = await ctx.db.artisanSurvey.findFirst({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const data = {
      shop,

      completedSurvey: !!survey,
      hasProducts: (shop?._count.products ?? 0) > 0,
      hasServices: (shop?._count.services ?? 0) > 0,
      hasHostedWebsite: shop?.websiteProvision?.status === "ACTIVE",
    };

    return data;
  }),
});
