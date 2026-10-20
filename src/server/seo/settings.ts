import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import {
  DEFAULT_DESCRIPTION,
  SITE_ALTERNATE_NAMES,
  SITE_NAME,
} from "~/lib/seo/site";
import { db } from "~/server/db";

/** Cache tags; the siteSettings/pageSeo routers revalidate these on save. */
export const SITE_SETTINGS_TAG = "site-settings";
export const PAGE_SEO_TAG = "page-seo";

/** SiteSettings is a singleton row with this id. */
export const SITE_SETTINGS_ID = "default";

// Keeps a missed revalidateTag (e.g. a direct DB edit) from sticking forever.
const REVALIDATE_SECONDS = 3600;

export type SiteSettings = {
  siteName: string;
  alternateNames: string[];
  tagline: string | null;
  defaultTitle: string | null;
  defaultDescription: string;
  defaultOgImage: string | null;
  logo: string | null;
  contactEmail: string | null;
  socialLinks: string[];
  twitterHandle: string | null;
  googleVerification: string | null;
  bingVerification: string | null;
  allowAiCrawlers: boolean;
  llmsIntro: string | null;
};

/** What the site used before SiteSettings existed; used until a row is saved. */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: SITE_NAME,
  alternateNames: SITE_ALTERNATE_NAMES,
  tagline: null,
  defaultTitle: null,
  defaultDescription: DEFAULT_DESCRIPTION,
  defaultOgImage: null,
  logo: null,
  contactEmail: null,
  socialLinks: [],
  twitterHandle: null,
  googleVerification: null,
  bingVerification: null,
  allowAiCrawlers: true,
  llmsIntro: null,
};

function nonBlank(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed === "" ? null : trimmed;
}

/** Uncached read, merged over the defaults. The admin form uses this directly. */
export async function readSiteSettings(): Promise<SiteSettings> {
  const row = await db.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });
  if (!row) return DEFAULT_SITE_SETTINGS;

  return {
    siteName: row.siteName.trim() || SITE_NAME,
    alternateNames: row.alternateNames,
    tagline: row.tagline,
    defaultTitle: row.defaultTitle,
    defaultDescription: nonBlank(row.defaultDescription) ?? DEFAULT_DESCRIPTION,
    defaultOgImage: row.defaultOgImage,
    logo: row.logo,
    contactEmail: row.contactEmail,
    socialLinks: row.socialLinks,
    twitterHandle: row.twitterHandle,
    googleVerification: row.googleVerification,
    bingVerification: row.bingVerification,
    allowAiCrawlers: row.allowAiCrawlers,
    llmsIntro: row.llmsIntro,
  };
}

const cachedSiteSettings = unstable_cache(readSiteSettings, ["site-settings"], {
  tags: [SITE_SETTINGS_TAG],
  revalidate: REVALIDATE_SECONDS,
});

/**
 * Site-wide settings for metadata, schema and robots. Never throws: at build
 * time the database may be unreachable (Docker builds), so fall back to the
 * defaults. Errors are caught outside `unstable_cache` so the fallback itself
 * is never cached.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    return await cachedSiteSettings();
  } catch (error) {
    console.error("[seo] failed to load site settings", error);
    return DEFAULT_SITE_SETTINGS;
  }
});

export type PageSeoOverride = {
  path: string;
  title: string | null;
  description: string | null;
  ogImage: string | null;
  noIndex: boolean;
};

// The table holds at most one row per static page, so cache it whole.
const cachedPageSeo = unstable_cache(
  async (): Promise<PageSeoOverride[]> =>
    db.pageSeo.findMany({
      select: {
        path: true,
        title: true,
        description: true,
        ogImage: true,
        noIndex: true,
      },
    }),
  ["page-seo"],
  { tags: [PAGE_SEO_TAG], revalidate: REVALIDATE_SECONDS },
);

const getAllPageSeo = cache(async (): Promise<PageSeoOverride[]> => {
  try {
    return await cachedPageSeo();
  } catch (error) {
    console.error("[seo] failed to load page overrides", error);
    return [];
  }
});

/** The admin override for a static page path, if any. Never throws. */
export async function getPageSeo(path: string) {
  const overrides = await getAllPageSeo();
  return overrides.find((override) => override.path === path) ?? null;
}
