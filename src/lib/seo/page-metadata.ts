import "server-only";

import type { Metadata } from "next";

import type { BuildMetadataInput } from "./site";
import { getPageSeo, getSiteSettings } from "~/server/seo/settings";

import { buildMetadata } from "./site";

/**
 * `buildMetadata` with the admin-editable layers applied, lowest to highest:
 * SiteSettings defaults (brand, description, share image, twitter handle),
 * then the page's own values, then the /admin/seo PageSeo override for
 * `input.path` (title, description, image, noindex).
 */
export async function buildPageMetadata(
  input: BuildMetadataInput,
): Promise<Metadata> {
  const [settings, override] = await Promise.all([
    getSiteSettings(),
    getPageSeo(input.path),
  ]);

  const images = override?.ogImage
    ? [override.ogImage]
    : input.images?.length
      ? input.images
      : settings.defaultOgImage
        ? [settings.defaultOgImage]
        : undefined;

  return buildMetadata({
    ...input,
    title: override?.title ?? input.title,
    description:
      override?.description ?? input.description ?? settings.defaultDescription,
    images,
    // An override can hide a page, but never un-hide one the page itself hides.
    noIndex: (override?.noIndex ?? false) || (input.noIndex ?? false),
    siteName: settings.siteName,
    twitterSite: settings.twitterHandle,
  });
}
