import "server-only";

import type { Metadata } from "next";

import { env } from "~/env";

import { absoluteUrl, SITE_URL } from "./site-url";

export { absoluteUrl, SITE_URL };

export const SITE_NAME = "Artisanal Futures";
export const SITE_ALTERNATE_NAMES = ["ArtisanalFutures", "AF"];
export const DEFAULT_DESCRIPTION =
  "Shop worker-owned stores, share knowledge and tech, & participate in the transition to a decolonized circular economy.";

/** Path of the default branded share card (src/app/opengraph-image.tsx). */
const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

/**
 * Shorten text for a meta description: strips markdown/HTML and collapses
 * whitespace, then cuts on a word boundary with an ellipsis.
 */
export function truncate(text: string | null | undefined, max = 155) {
  if (!text) return "";

  const plain = text
    .replace(/<[^>]*>/g, " ") // HTML tags
    .replace(/&nbsp;/g, " ") // scraped descriptions carry HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // markdown images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // markdown links -> link text
    .replace(/[*_~`>#]+/g, "") // markdown emphasis / headings / quotes
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= max) return plain;

  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  // Only back up to a word boundary if that doesn't throw away most of the text.
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:!?-]+$/, "")}…`;
}

const PRODUCTION_HOSTS = ["artisanalfutures.org", "www.artisanalfutures.org"];

/**
 * Whether search engines may index this deployment. SEO_ALLOW_INDEXING wins
 * when set; otherwise only the production domain is indexable.
 */
export function isIndexingAllowed() {
  if (env.SEO_ALLOW_INDEXING !== undefined) return env.SEO_ALLOW_INDEXING;
  try {
    return PRODUCTION_HOSTS.includes(new URL(env.BETTER_AUTH_URL).hostname);
  } catch {
    return false;
  }
}

export type BuildMetadataInput = {
  /** Page title. The root template appends " – Artisanal Futures". */
  title?: string;
  /** Use `title` as-is, without the template's brand suffix (the homepage). */
  absoluteTitle?: boolean;
  description?: string;
  /** Site-relative path, used for the canonical URL and og:url. */
  path: string;
  /** Share images (absolute or site-relative). Defaults to the branded card. */
  images?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
  /** Brand for og:site_name and social titles; SiteSettings.siteName. */
  siteName?: string;
  /** twitter:site handle ("@name"); SiteSettings.twitterHandle. */
  twitterSite?: string | null;
};

/**
 * Metadata for a public page, with canonical, Open Graph and Twitter fields
 * kept consistent. A child page's `openGraph`/`twitter` replace the parent's
 * wholesale in Next, so every field is set here rather than inherited.
 */
export function buildMetadata({
  title,
  absoluteTitle = false,
  description = DEFAULT_DESCRIPTION,
  path,
  images,
  noIndex = false,
  type = "website",
  siteName = SITE_NAME,
  twitterSite,
}: BuildMetadataInput): Metadata {
  const imageUrls = (images?.length ? images : [DEFAULT_OG_IMAGE_PATH]).map(
    absoluteUrl,
  );
  // The OG/Twitter title doesn't go through the title template, so add the
  // brand ourselves when there is a page-specific title.
  const socialTitle = !title
    ? siteName
    : absoluteTitle
      ? title
      : `${title} – ${siteName}`;

  return {
    ...(title ? { title: absoluteTitle ? { absolute: title } : title } : {}),
    description,
    alternates: { canonical: path },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      url: path,
      siteName,
      title: socialTitle,
      description,
      images: imageUrls,
      type,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      ...(twitterSite ? { site: twitterSite } : {}),
      title: socialTitle,
      description,
      images: imageUrls,
    },
  };
}
