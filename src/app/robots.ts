import type { MetadataRoute } from "next";

import { absoluteUrl, isIndexingAllowed } from "~/lib/seo/site";
import { getSiteSettings } from "~/server/seo/settings";

// The AI-crawler rule follows SiteSettings; saving them revalidates this file
// through the settings cache tag, and this is the fallback.
export const revalidate = 3600;

// Private, transactional and utility routes that should never be crawled.
const DISALLOWED_PATHS = [
  "/admin",
  "/api",
  "/auth",
  "/account",
  "/welcome",
  "/unauthorized",
  "/join/welcome",
  "/forums/create",
  "/forums/r/create",
  "/*/submit",
  "/donate/success",
  "/donate/cancel",
  "/donate/error",
];

// Search and AI answer-engine crawlers. Listed explicitly so the intent is
// visible either way: allowed by default, shut out entirely when an admin turns
// off "Allow AI crawlers" at /admin/seo.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Dev/staging: keep every crawler out.
  if (!isIndexingAllowed()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const { allowAiCrawlers } = await getSiteSettings();

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS },
      allowAiCrawlers
        ? { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOWED_PATHS }
        : { userAgent: AI_CRAWLERS, disallow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
