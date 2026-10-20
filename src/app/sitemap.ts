import type { MetadataRoute } from "next";

import { shopPath } from "~/lib/seo/paths";
import { absoluteUrl } from "~/lib/seo/site";
import { STATIC_PAGES } from "~/lib/seo/static-pages";
import { db } from "~/server/db";
import {
  getLocationLandingPages,
  getTagLandingPages,
} from "~/server/seo/landing-pages";
import { getPageSeo } from "~/server/seo/settings";

// Regenerate at most hourly; shops and categories change rarely.
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

async function getDynamicEntries(): Promise<Entry[]> {
  // Category links are built as encodeURIComponent(name.toLowerCase()) in the
  // collections pages; keep these URLs identical or they won't match the
  // canonical on the category page.
  const [
    shops,
    productCategories,
    serviceCategories,
    communities,
    locationPages,
    tagPages,
  ] = await Promise.all([
    db.shop.findMany({
      // Admin-noindexed shops stay reachable but out of the sitemap.
      where: { isPublic: true, seoNoIndex: false },
      select: { id: true, slug: true, updatedAt: true },
    }),
    db.category.findMany({
      where: {
        type: "PRODUCT",
        OR: [{ parentId: null }, { products: { some: { isPublic: true } } }],
      },
      select: { name: true },
    }),
    db.category.findMany({
      where: {
        type: "SERVICE",
        OR: [{ parentId: null }, { services: { some: { isPublic: true } } }],
      },
      select: { name: true },
    }),
    db.subreddit.findMany({
      where: { isPublic: true },
      select: { name: true, updatedAt: true },
    }),
    // Landing pages only exist with enough matching shops (thin-content guard).
    getLocationLandingPages(),
    getTagLandingPages(),
  ]);

  const categoryPath = (base: string, name: string) =>
    `${base}/${encodeURIComponent(name.toLowerCase())}`;

  const landingPaths = [
    // The /shops/in and /shops/tag index pages exist once they list something.
    ...(locationPages.length > 0 ? ["/shops/in"] : []),
    ...(tagPages.length > 0 ? ["/shops/tag"] : []),
    ...locationPages.map(({ path }) => path),
    ...tagPages.map(({ path }) => path),
  ];

  return [
    ...shops.map((shop) => ({
      url: absoluteUrl(shopPath(shop)),
      lastModified: shop.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...landingPaths.map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...productCategories.map((category) => ({
      url: absoluteUrl(categoryPath("/collections/products", category.name)),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...serviceCategories.map((category) => ({
      url: absoluteUrl(categoryPath("/collections/services", category.name)),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...communities.map((community) => ({
      url: absoluteUrl(`/forums/r/${encodeURIComponent(community.name)}`),
      lastModified: community.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.4,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages an admin set to noindex at /admin/seo are left out. getPageSeo
  // never throws, so this is safe at build time too.
  const overrides = await Promise.all(
    STATIC_PAGES.map(({ path }) => getPageSeo(path)),
  );
  const staticEntries: Entry[] = STATIC_PAGES.filter(
    (_page, index) => !overrides[index]?.noIndex,
  ).map(({ path, priority }) => ({
    url: absoluteUrl(path),
    changeFrequency: "monthly",
    priority,
  }));

  // The sitemap is prerendered at build time, where the database may be
  // unreachable (e.g. Docker builds). Fall back to the static pages rather than
  // failing the build; the next revalidation fills in the rest.
  try {
    return [...staticEntries, ...(await getDynamicEntries())];
  } catch (error) {
    console.error("[sitemap] failed to load dynamic entries", error);
    return staticEntries;
  }
}
