import "server-only";

import type { ShopProfileSource } from "./build";
import type { NetworkShopInput } from "./network";
import { db } from "~/server/db";

import { rankCategories } from "./network";
import { DIRECTORY_MAX_SERVICES, MAX_ITEMS } from "./types";

/** Upcoming events considered for the network block before ranking. */
const MAX_EVENT_CANDIDATES = 200;

const geoOf = (
  address: { latitude: number | null; longitude: number | null } | null,
) =>
  address &&
  typeof address.latitude === "number" &&
  typeof address.longitude === "number"
    ? { lat: address.latitude, lng: address.longitude }
    : null;

/**
 * Prisma reads for the Shop Profile API. Tight `select`s only: nothing private
 * (ownerId, phone/email, private contact, seo overrides, allowInsecureOrigin,
 * geocodeQuery) is ever selected. The street lines, real coordinates and
 * `syncUrl` are selected solely so the pure builder can derive their public
 * forms; it never emits them as-is.
 *
 * Four queries, run together: the subject shop with its catalog; the other
 * public + indexable shops (the same rule as the sitemap and llms.txt) with
 * their public service names and product counts; every category's public
 * items' shop ids (to rank each shop's categories); and upcoming events on
 * public shops (as `event.getUpcomingEvents`).
 *
 * Returns null when the shop no longer exists or is hidden.
 */
export async function loadShopProfileSource(
  shopId: string,
  now: Date,
): Promise<ShopProfileSource | null> {
  const [shop, otherShops, categoryRows, eventRows] = await Promise.all([
    db.shop.findFirst({
      where: { id: shopId, isPublic: true },
      select: {
        id: true,
        slug: true,
        name: true,
        ownerName: true,
        bio: true,
        description: true,
        website: true,
        socialLinks: true,
        logoPhoto: true,
        attributeTags: true,
        collabOffers: true,
        collabOfferTags: true,
        collabNeeds: true,
        collabNeedTags: true,
        locationType: true,
        syncPlatform: true,
        syncEnabled: true,
        syncUrl: true,
        lastSyncedAt: true,
        address: {
          select: {
            address: true,
            additional: true,
            street: true,
            zip: true,
            city: true,
            state: true,
            country: true,
            latitude: true,
            longitude: true,
            geocodePrecision: true,
          },
        },
        _count: {
          select: {
            products: { where: { isPublic: true } },
            services: { where: { isPublic: true } },
          },
        },
        products: {
          where: { isPublic: true },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: MAX_ITEMS,
          select: {
            name: true,
            description: true,
            priceInCents: true,
            currency: true,
            imageUrl: true,
            productUrl: true,
            tags: true,
            attributeTags: true,
            materialTags: true,
            environmentalTags: true,
            isPublic: true,
            isFeatured: true,
            createdAt: true,
            categories: { select: { name: true } },
          },
        },
        services: {
          where: { isPublic: true },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: MAX_ITEMS,
          select: {
            name: true,
            description: true,
            priceInCents: true,
            currency: true,
            imageUrl: true,
            serviceUrl: true,
            durationInMinutes: true,
            tags: true,
            attributeTags: true,
            isPublic: true,
            isFeatured: true,
            createdAt: true,
            categories: { select: { name: true } },
          },
        },
      },
    }),
    db.shop.findMany({
      where: { isPublic: true, seoNoIndex: false, id: { not: shopId } },
      select: {
        id: true,
        slug: true,
        name: true,
        bio: true,
        description: true,
        locationType: true,
        attributeTags: true,
        collabOffers: true,
        collabOfferTags: true,
        collabNeeds: true,
        collabNeedTags: true,
        address: {
          select: { city: true, state: true, latitude: true, longitude: true },
        },
        services: {
          where: { isPublic: true },
          orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
          take: DIRECTORY_MAX_SERVICES,
          select: { name: true },
        },
        _count: { select: { products: { where: { isPublic: true } } } },
      },
    }),
    db.category.findMany({
      select: {
        name: true,
        products: {
          where: { isPublic: true, shop: { isPublic: true } },
          select: { shopId: true },
        },
        services: {
          where: { isPublic: true, shop: { isPublic: true } },
          select: { shopId: true },
        },
      },
    }),
    db.event.findMany({
      where: {
        startDate: { gte: now },
        shop: { isPublic: true },
        shopId: { not: shopId },
      },
      orderBy: { startDate: "asc" },
      take: MAX_EVENT_CANDIDATES,
      select: {
        title: true,
        startDate: true,
        endDate: true,
        location: true,
        callToActionLink: true,
        shop: {
          select: {
            id: true,
            slug: true,
            name: true,
            address: {
              select: {
                city: true,
                state: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
    }),
  ]);
  if (!shop) return null;

  // shopId → one category name per public item it's on (ranked below).
  const categoryNamesByShop = new Map<string, string[]>();
  for (const category of categoryRows) {
    for (const { shopId: id } of [...category.products, ...category.services]) {
      if (!id) continue;
      const list = categoryNamesByShop.get(id) ?? [];
      list.push(category.name);
      categoryNamesByShop.set(id, list);
    }
  }

  const networkShops: NetworkShopInput[] = otherShops.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    city: s.address?.city ?? null,
    state: s.address?.state ?? null,
    geo: geoOf(s.address),
    locationType: s.locationType,
    bio: s.bio,
    description: s.description,
    attributeTags: s.attributeTags,
    collabOffers: s.collabOffers,
    collabOfferTags: s.collabOfferTags,
    collabNeeds: s.collabNeeds,
    collabNeedTags: s.collabNeedTags,
    categories: rankCategories(categoryNamesByShop.get(s.id) ?? []),
    services: s.services.map((sv) => sv.name),
    productCount: s._count.products,
  }));

  return {
    shop: {
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      ownerName: shop.ownerName,
      bio: shop.bio,
      description: shop.description,
      website: shop.website,
      socialLinks: shop.socialLinks,
      logoPhoto: shop.logoPhoto,
      attributeTags: shop.attributeTags,
      collabOffers: shop.collabOffers,
      collabOfferTags: shop.collabOfferTags,
      collabNeeds: shop.collabNeeds,
      collabNeedTags: shop.collabNeedTags,
      locationType: shop.locationType,
      syncPlatform: shop.syncPlatform,
      syncEnabled: shop.syncEnabled,
      syncUrl: shop.syncUrl,
      lastSyncedAt: shop.lastSyncedAt,
      address: shop.address,
    },
    products: shop.products.map((p) => ({
      ...p,
      categories: p.categories.map((c) => c.name),
    })),
    productTotal: shop._count.products,
    services: shop.services.map((sv) => ({
      ...sv,
      categories: sv.categories.map((c) => c.name),
    })),
    serviceTotal: shop._count.services,
    networkShops,
    events: eventRows.map((e) => ({
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      callToActionLink: e.callToActionLink,
      shop: {
        id: e.shop.id,
        slug: e.shop.slug,
        name: e.shop.name,
        city: e.shop.address?.city ?? null,
        state: e.shop.address?.state ?? null,
        geo: geoOf(e.shop.address),
      },
    })),
  };
}
