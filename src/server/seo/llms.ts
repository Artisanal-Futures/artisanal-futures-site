import "server-only";

import { shopPath } from "~/lib/seo/paths";
import { absoluteUrl, truncate } from "~/lib/seo/site";
import { STATIC_PAGES } from "~/lib/seo/static-pages";
import { db } from "~/server/db";
import {
  getLocationLandingPages,
  getTagLandingPages,
} from "~/server/seo/landing-pages";
import { getPageSeo, getSiteSettings } from "~/server/seo/settings";

/**
 * Builders for /llms.txt (an index of the site for AI assistants) and
 * /llms-full.txt (the same, with the full shop profiles inline).
 * Convention: https://llmstxt.org
 */

/** Used when no llmsIntro is set. Facts come from the About us page. */
const DEFAULT_INTRO =
  "Artisanal Futures helps worker-owned businesses, worker collectives and other artisan enterprises build a community-based, decolonized circular economy. It is a directory and marketplace of artisan shops and a space for sharing knowledge and tools. It does not charge fees or handle transactions: customers are sent to each artisan's own website to buy.";

const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/shops": "Directory of every artisan shop in the collective",
  "/collections/products": "Browse products by category",
  "/collections/services": "Browse services by category",
  "/about-us": "Mission and how the platform works",
  "/contact": "Contact the Artisanal Futures team",
  "/donate": "Support the collective",
  "/join": "How artisans and worker-owned businesses join",
  "/join/criteria": "Who can join and what is required",
  "/tools": "Free tools for artisans and small businesses",
  "/tools/artisan-map": "Map of artisan shops",
  "/tools/sankofa-sizer": "Sizing tool",
  "/tools/shop-rate-calculator": "Calculator for setting a shop's hourly rate",
  "/forums": "Community forums for artisans and supporters",
  "/forums/communities": "List of forum communities",
};

const MAX_PROFILE_ITEMS = 30;
const MAX_ABOUT_LENGTH = 1500;

type LlmsShop = Awaited<ReturnType<typeof loadShops>>[number];

/** Public + indexable shops, the same rule the sitemap uses. */
function loadShops() {
  return db.shop.findMany({
    where: { isPublic: true, seoNoIndex: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      ownerName: true,
      bio: true,
      description: true,
      website: true,
      socialLinks: true,
      attributeTags: true,
      address: { select: { city: true, state: true } },
    },
  });
}

function locationOf(shop: LlmsShop) {
  return [shop.address?.city, shop.address?.state]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

function summaryOf(shop: LlmsShop) {
  const summary = truncate(
    shop.description?.trim() ? shop.description : shop.bio,
    160,
  );
  return summary === ""
    ? `Artisan business led by ${shop.ownerName}.`
    : summary;
}

function categoryPath(base: string, name: string) {
  return `${base}/${encodeURIComponent(name.toLowerCase())}`;
}

function formatPrice(cents: number | null, currency: string | null) {
  if (!cents || cents <= 0) return null;
  const code = currency?.trim() ?? "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code.length > 0 ? code : "USD",
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

/** `# Name`, the one-line summary and the intro; shared by both files. */
async function header() {
  const settings = await getSiteSettings();
  const lines = [
    `# ${settings.siteName}`,
    "",
    `> ${settings.defaultDescription}`,
    "",
    settings.llmsIntro?.trim() ?? DEFAULT_INTRO,
    "",
  ];
  return lines;
}

async function keyPages() {
  // Pages an admin set to noindex at /admin/seo are left out, as in the sitemap.
  const overrides = await Promise.all(
    STATIC_PAGES.map(({ path }) => getPageSeo(path)),
  );
  const pages = STATIC_PAGES.filter(
    (_page, index) => !overrides[index]?.noIndex,
  );

  const line = (page: (typeof STATIC_PAGES)[number]) => {
    const description = PAGE_DESCRIPTIONS[page.path];
    return `- [${page.label}](${absoluteUrl(page.path)})${
      description ? `: ${description}` : ""
    }`;
  };

  return {
    key: pages.filter((page) => page.priority >= 0.5).map(line),
    other: pages.filter((page) => page.priority < 0.5).map(line),
  };
}

export async function buildLlmsTxt() {
  const [
    lines,
    shops,
    pages,
    locations,
    tags,
    productCategories,
    serviceCategories,
  ] = await Promise.all([
    header(),
    loadShops(),
    keyPages(),
    getLocationLandingPages(),
    getTagLandingPages(),
    db.category.findMany({
      where: {
        type: "PRODUCT",
        OR: [{ parentId: null }, { products: { some: { isPublic: true } } }],
      },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    db.category.findMany({
      where: {
        type: "SERVICE",
        OR: [{ parentId: null }, { services: { some: { isPublic: true } } }],
      },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  lines.push("## Key pages", "", ...pages.key, "");

  if (shops.length > 0) {
    lines.push("## Artisan shops", "");
    for (const shop of shops) {
      const location = locationOf(shop);
      lines.push(
        `- [${shop.name}](${absoluteUrl(shopPath(shop))}): ${summaryOf(shop)}${
          location ? ` (${location})` : ""
        }`,
      );
    }
    lines.push("");
  }

  const browse = [
    ...locations.map(
      (place) =>
        `- [Artisan shops in ${place.name}](${absoluteUrl(place.path)}): ${place.count} shops`,
    ),
    ...tags.map(
      (tag) =>
        `- [${tag.name} artisan shops](${absoluteUrl(tag.path)}): ${tag.count} shops`,
    ),
    ...productCategories.map(
      (category) =>
        `- [${category.name} (products)](${absoluteUrl(
          categoryPath("/collections/products", category.name),
        )})`,
    ),
    ...serviceCategories.map(
      (category) =>
        `- [${category.name} (services)](${absoluteUrl(
          categoryPath("/collections/services", category.name),
        )})`,
    ),
  ];
  if (browse.length > 0) lines.push("## Browse", "", ...browse, "");

  lines.push(
    "## Optional",
    "",
    `- [Full shop profiles](${absoluteUrl("/llms-full.txt")}): every shop's story, location, links and product list in one file`,
    ...pages.other,
    "",
  );

  return lines.join("\n");
}

export async function buildLlmsFullTxt() {
  const [lines, shops] = await Promise.all([header(), loadShops()]);

  // One query per table rather than per shop. Featured items first, so the cap
  // keeps a shop's best sellers.
  const [products, services] = await Promise.all([
    db.product.findMany({
      where: { isPublic: true, shopId: { in: shops.map((shop) => shop.id) } },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      select: {
        shopId: true,
        name: true,
        priceInCents: true,
        currency: true,
        productUrl: true,
        categories: { select: { name: true } },
      },
    }),
    db.service.findMany({
      where: { isPublic: true, shopId: { in: shops.map((shop) => shop.id) } },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      select: {
        shopId: true,
        name: true,
        priceInCents: true,
        currency: true,
        serviceUrl: true,
        categories: { select: { name: true } },
      },
    }),
  ]);

  type Item = {
    name: string;
    priceInCents: number | null;
    currency: string | null;
    url: string | null;
    categories: { name: string }[];
  };
  const itemsByShop = new Map<string, Item[]>();
  const push = (shopId: string | null, item: Item) => {
    if (!shopId) return;
    const list = itemsByShop.get(shopId) ?? [];
    list.push(item);
    itemsByShop.set(shopId, list);
  };
  for (const product of products) {
    push(product.shopId, { ...product, url: product.productUrl });
  }
  for (const service of services) {
    push(service.shopId, { ...service, url: service.serviceUrl });
  }

  for (const shop of shops) {
    const items = itemsByShop.get(shop.id) ?? [];
    const location = locationOf(shop);
    const about = [shop.description, shop.bio]
      .map((text) => text?.trim())
      .filter(
        (text, index, all): text is string =>
          !!text && all.indexOf(text) === index,
      )
      .join("\n\n");
    const categories = [
      ...new Set(items.flatMap((item) => item.categories.map((c) => c.name))),
    ].sort((a, b) => a.localeCompare(b));

    lines.push(`## ${shop.name}`, "", `- URL: ${absoluteUrl(shopPath(shop))}`);
    lines.push(`- Owner: ${shop.ownerName}`);
    if (location) lines.push(`- Location: ${location}`);
    if (shop.website?.trim()) lines.push(`- Website: ${shop.website.trim()}`);
    if (shop.socialLinks.length > 0) {
      lines.push(`- Social: ${shop.socialLinks.join(", ")}`);
    }
    if (shop.attributeTags.length > 0) {
      lines.push(`- Tags: ${shop.attributeTags.join(", ")}`);
    }
    if (categories.length > 0) lines.push(`- Makes: ${categories.join(", ")}`);
    lines.push("");

    // truncate() strips markdown/HTML and collapses whitespace; at this length
    // it only cuts very long profiles.
    const aboutText = truncate(about, MAX_ABOUT_LENGTH);
    if (aboutText) lines.push(aboutText, "");

    if (items.length > 0) {
      lines.push(
        `### Products and services${
          items.length > MAX_PROFILE_ITEMS
            ? ` (first ${MAX_PROFILE_ITEMS} of ${items.length})`
            : ""
        }`,
        "",
      );
      for (const item of items.slice(0, MAX_PROFILE_ITEMS)) {
        const price = formatPrice(item.priceInCents, item.currency);
        lines.push(
          `- ${[item.name, price, item.url?.trim()].filter(Boolean).join(" — ")}`,
        );
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
