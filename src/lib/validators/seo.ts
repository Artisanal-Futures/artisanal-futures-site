import { z } from "zod";

/** Hard caps. The forms show softer targets (60/160) as counters. */
export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 200;
/** What search results typically show before truncating. */
export const SEO_TITLE_TARGET = 60;
export const SEO_DESCRIPTION_TARGET = 160;

/** /shops/{slug}: lowercase words joined by single hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Most profile links a shop or the site can list. */
export const MAX_LINKS = 20;

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** "" and undefined become null; anything else passes through. */
const emptyToNull = (value: string | null | undefined) =>
  value === undefined || value === "" ? null : value;

/** Trimmed free text; blank becomes null. */
export const optionalText = (max: number, label = "This field") =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .nullish()
    .transform(emptyToNull);

/** Trimmed http(s) URL; blank becomes null. */
export const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || isHttpUrl(value),
    "Enter a full URL, starting with https://",
  )
  .nullish()
  .transform(emptyToNull);

/**
 * A list of profile URLs (Instagram, Etsy, ...). Blank rows are allowed while
 * editing and dropped on save, so error indices line up with the inputs.
 */
export const urlListSchema = z
  .array(
    z
      .string()
      .trim()
      .refine(
        (value) => value === "" || isHttpUrl(value),
        "Enter a full URL, starting with https://",
      ),
  )
  .max(MAX_LINKS, `Add at most ${MAX_LINKS} links`)
  .transform((links) => [...new Set(links.filter(Boolean))]);

const textListSchema = z
  .array(z.string().trim().max(100))
  .max(MAX_LINKS)
  .transform((items) => [...new Set(items.filter(Boolean))]);

export const siteSettingsSchema = z.object({
  siteName: z
    .string()
    .trim()
    .min(1, "Site name is required")
    .max(
      SEO_TITLE_MAX,
      `Site name must be ${SEO_TITLE_MAX} characters or fewer`,
    ),
  alternateNames: textListSchema,
  tagline: optionalText(200, "Tagline"),
  defaultTitle: optionalText(SEO_TITLE_MAX, "Default title"),
  defaultDescription: optionalText(SEO_DESCRIPTION_MAX, "Default description"),
  defaultOgImage: optionalUrl,
  logo: optionalUrl,
  contactEmail: z
    .union([z.string().trim().email("Enter a valid email"), z.literal("")])
    .nullish()
    .transform(emptyToNull),
  socialLinks: urlListSchema,
  twitterHandle: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^@?\w{1,15}$/.test(value),
      "Enter a handle like @artisanalfutures",
    )
    .nullish()
    .transform((value) => {
      const handle = emptyToNull(value);
      return handle === null ? null : `@${handle.replace(/^@/, "")}`;
    }),
  googleVerification: optionalText(200, "Google verification"),
  bingVerification: optionalText(200, "Bing verification"),
  allowAiCrawlers: z.boolean(),
  llmsIntro: optionalText(5000, "llms.txt intro"),
});

export type SiteSettingsInput = z.input<typeof siteSettingsSchema>;
export type SiteSettingsValues = z.output<typeof siteSettingsSchema>;

export const pageSeoSchema = z.object({
  path: z.string().trim().startsWith("/"),
  title: optionalText(SEO_TITLE_MAX, "Title"),
  description: optionalText(SEO_DESCRIPTION_MAX, "Description"),
  ogImage: optionalUrl,
  noIndex: z.boolean(),
});

export type PageSeoInput = z.input<typeof pageSeoSchema>;
export type PageSeoValues = z.output<typeof pageSeoSchema>;

/**
 * Admin-only search/share fields on a shop. A blank slug keeps the current one
 * (or auto-generates one for a shop that has none).
 */
export const shopSeoSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80, "Slug must be 80 characters or fewer")
    .refine(
      (value) => value === "" || SLUG_PATTERN.test(value),
      "Use lowercase letters, numbers and single hyphens, e.g. kente-collective",
    ),
  seoTitle: optionalText(SEO_TITLE_MAX, "SEO title"),
  seoDescription: optionalText(SEO_DESCRIPTION_MAX, "SEO description"),
  seoImageUrl: optionalUrl,
  seoNoIndex: z.boolean(),
});

export type ShopSeoInput = z.input<typeof shopSeoSchema>;
export type ShopSeoValues = z.output<typeof shopSeoSchema>;
