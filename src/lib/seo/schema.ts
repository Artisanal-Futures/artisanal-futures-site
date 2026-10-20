import "server-only";

import type {
  AboutPage,
  BreadcrumbList,
  CollectionPage,
  DiscussionForumPosting,
  Event,
  FAQPage,
  LocalBusiness,
  Offer,
  Organization,
  Store,
  WebSite,
  WithContext,
} from "schema-dts";

import type { SiteSettings } from "~/server/seo/settings";
import { env } from "~/env";
import {
  addFullProductImageUrl,
  addFullServiceImageUrl,
} from "~/lib/add-full-image-url";
import { handleImageUrl } from "~/lib/handle-image-url";

import { shopPath } from "./paths";
import { absoluteUrl, SITE_URL, truncate } from "./site";

const CONTEXT = "https://schema.org" as const;

/** Stable node ids, so other pages can reference the org/site instead of repeating them. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const LOGO_PATH = "/logos/logo.png";

/** Offers listed on a shop's catalog; keeps a very large shop's markup bounded. */
const MAX_CATALOG_ITEMS = 50;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Photos are stored as bare file names (shop storage), absolute URLs, or site paths. */
function resolveImage(image: string | null | undefined) {
  if (!image) return undefined;
  const url = absoluteUrl(
    /^(https?:|\/)/.test(image) ? image : handleImageUrl(image),
  );
  // File names can contain spaces; normalise so the URL is valid.
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
}

/** Owners type their website freely, so tolerate a missing scheme. */
function normalizeWebsite(website: string | null | undefined) {
  const value = website?.trim();
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function nonEmpty(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

/** The SiteSettings fields the org/site nodes use (`getSiteSettings()`). */
type OrganizationSettings = Pick<
  SiteSettings,
  | "siteName"
  | "alternateNames"
  | "defaultDescription"
  | "logo"
  | "contactEmail"
  | "socialLinks"
>;

export function organizationSchema(
  settings: OrganizationSettings,
): WithContext<Organization> {
  const supportEmail =
    nonEmpty(settings.contactEmail) ?? env.NEXT_PUBLIC_EMAIL_FROM_SUPPORT;

  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: settings.siteName,
    ...(settings.alternateNames.length > 0
      ? { alternateName: settings.alternateNames }
      : {}),
    url: `${SITE_URL}/`,
    logo: resolveImage(settings.logo) ?? absoluteUrl(LOGO_PATH),
    description: settings.defaultDescription,
    // Social/Wikidata profiles: the strongest entity-resolution signal.
    ...(settings.socialLinks.length > 0
      ? { sameAs: settings.socialLinks }
      : {}),
    ...(EMAIL_PATTERN.test(supportEmail)
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: supportEmail,
          },
        }
      : {}),
  };
}

export function websiteSchema(
  settings: Pick<SiteSettings, "siteName" | "alternateNames">,
): WithContext<WebSite> {
  // schema-dts doesn't type `query-input`, so build the action as a plain
  // (non-fresh) object to sidestep the excess-property check.
  const potentialAction = {
    "@type": "SearchAction" as const,
    target: {
      "@type": "EntryPoint" as const,
      urlTemplate: `${SITE_URL}/collections/products/all-products?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  };

  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: settings.siteName,
    ...(settings.alternateNames.length > 0
      ? { alternateName: settings.alternateNames }
      : {}),
    url: `${SITE_URL}/`,
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction,
  };
}

type PriceFields = {
  priceInCents?: number | null;
  currency?: string | null;
};

/** Decimal price plus currency; both are omitted when the item has no price. */
function priceFields({ priceInCents, currency }: PriceFields) {
  // 0 is how unpriced items are stored, not a free listing.
  if (!priceInCents || priceInCents <= 0) return {};
  return {
    price: priceInCents / 100,
    priceCurrency: nonEmpty(currency) ?? "USD",
  };
}

type ShopProductInput = PriceFields & {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  productUrl?: string | null;
  isPublic: boolean;
};

type ShopServiceInput = PriceFields & {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  serviceUrl?: string | null;
  isPublic: boolean;
};

export type ShopSchemaInput = {
  id: string;
  slug?: string | null;
  name: string;
  ownerName: string;
  bio?: string | null;
  description?: string | null;
  ownerPhoto?: string | null;
  logoPhoto?: string | null;
  coverPhoto?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  socialLinks?: string[];
  attributeTags: string[];
  /** Only a STOREFRONT publishes its street; missing is treated as private. */
  locationType?: "STOREFRONT" | "HOME_BASED" | "AREA";
  address?: {
    address?: string | null;
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  } | null;
  products: ShopProductInput[];
  services: ShopServiceInput[];
};

/** Catalog entries stay short; the full text lives on the shop's own site. */
function itemDescription(description: string | null | undefined) {
  const text = truncate(description, 300);
  return text ? { description: text } : {};
}

function productOffer(product: ShopProductInput): Offer {
  const image = resolveImage(
    addFullProductImageUrl({ imageUrl: product.imageUrl }).imageUrl,
  );

  return {
    "@type": "Offer",
    ...(nonEmpty(product.productUrl) ? { url: product.productUrl! } : {}),
    ...priceFields(product),
    itemOffered: {
      "@type": "Product",
      name: product.name,
      ...itemDescription(product.description),
      ...(image ? { image } : {}),
    },
  };
}

function serviceOffer(service: ShopServiceInput): Offer {
  const image = resolveImage(
    addFullServiceImageUrl({ imageUrl: service.imageUrl })?.imageUrl,
  );

  return {
    "@type": "Offer",
    ...(nonEmpty(service.serviceUrl) ? { url: service.serviceUrl! } : {}),
    ...priceFields(service),
    itemOffered: {
      "@type": "Service",
      name: service.name,
      ...itemDescription(service.description),
      ...(image ? { image } : {}),
    },
  };
}

export function shopSchema(
  shop: ShopSchemaInput,
): WithContext<Store | LocalBusiness | Organization> {
  const products = shop.products.filter((product) => product.isPublic);
  const services = shop.services.filter((service) => service.isPublic);

  // Home-based and area-only shops keep their street private (the owner's
  // preview still loads it), and drop a ZIP+4 to the 5-digit ZIP.
  const isStorefront = shop.locationType === "STOREFRONT";
  const street = isStorefront
    ? [nonEmpty(shop.address?.address), nonEmpty(shop.address?.street)]
        .filter(Boolean)
        .join(", ")
    : "";
  const zip = nonEmpty(shop.address?.zip);
  const addressParts = {
    streetAddress: street || undefined,
    addressLocality: nonEmpty(shop.address?.city),
    addressRegion: nonEmpty(shop.address?.state),
    postalCode: isStorefront ? zip : zip?.replace(/^(\d{5})[-\s]?\d{4}$/, "$1"),
    addressCountry: nonEmpty(shop.address?.country),
  };
  // A bare country says nothing about where the business is.
  const hasAddress = Object.entries(addressParts).some(
    ([key, value]) => key !== "addressCountry" && !!value,
  );

  // Store when there is something to buy, LocalBusiness otherwise, and a plain
  // Organization when there is no address to be "local" to.
  const type = !hasAddress
    ? "Organization"
    : products.length > 0
      ? "Store"
      : "LocalBusiness";

  const url = absoluteUrl(shopPath(shop));
  const website = normalizeWebsite(shop.website);
  const sameAs = [
    ...new Set(
      [website, ...(shop.socialLinks ?? []).map(normalizeWebsite)].filter(
        (link): link is string => !!link,
      ),
    ),
  ];
  const description = truncate(nonEmpty(shop.description) ?? shop.bio, 500);

  const images = [shop.coverPhoto, shop.logoPhoto, shop.ownerPhoto]
    .map(resolveImage)
    .filter((image): image is string => !!image);
  const logo = resolveImage(shop.logoPhoto);

  const catalogItems = [
    ...products.map(productOffer),
    ...services.map(serviceOffer),
  ].slice(0, MAX_CATALOG_ITEMS);

  const ownerPhoto = resolveImage(shop.ownerPhoto);

  return {
    "@context": CONTEXT,
    "@type": type,
    "@id": `${url}#business`,
    name: shop.name,
    url,
    ...(description ? { description } : {}),
    ...(logo ? { logo } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(nonEmpty(shop.phone) ? { telephone: shop.phone! } : {}),
    ...(nonEmpty(shop.email) ? { email: shop.email! } : {}),
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            ...Object.fromEntries(
              Object.entries(addressParts).filter(([, value]) => !!value),
            ),
          },
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(nonEmpty(shop.ownerName)
      ? {
          founder: {
            "@type": "Person",
            name: shop.ownerName,
            ...(ownerPhoto ? { image: ownerPhoto } : {}),
          },
        }
      : {}),
    memberOf: { "@id": ORGANIZATION_ID },
    ...(shop.attributeTags.length > 0
      ? {
          knowsAbout: shop.attributeTags,
          keywords: shop.attributeTags.join(", "),
        }
      : {}),
    ...(catalogItems.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: `${shop.name} products and services`,
            itemListElement: catalogItems,
          },
        }
      : {}),
  } as WithContext<Store | LocalBusiness | Organization>;
}

type PathItem = { name: string; path: string };

export function breadcrumbSchema(
  items: PathItem[],
): WithContext<BreadcrumbList> {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function collectionPageSchema({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description?: string;
  path: string;
  items: PathItem[];
}): WithContext<CollectionPage> {
  return {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    name,
    ...(description ? { description } : {}),
    url: absoluteUrl(path),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  };
}

export function faqSchema(
  qas: { question: string; answer: string }[],
): WithContext<FAQPage> {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: qas.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

export function aboutPageSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}): WithContext<AboutPage> {
  return {
    "@context": CONTEXT,
    "@type": "AboutPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    mainEntity: { "@id": ORGANIZATION_ID },
  };
}

/** The slice of a homepage event (`event.getHomepageEvents`) the schema needs. */
export type EventSchemaInput = {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  imageUrl: string | null;
  callToActionLink: string | null;
  shop: { id: string; slug?: string | null; name: string };
};

export function eventSchema(event: EventSchemaInput): WithContext<Event> {
  const image = resolveImage(event.imageUrl);
  const shopUrl = absoluteUrl(shopPath(event.shop));
  const location = nonEmpty(event.location);

  return {
    "@context": CONTEXT,
    "@type": "Event",
    "@id": `${SITE_URL}/#event-${event.id}`,
    name: event.title,
    description: truncate(event.description, 500),
    startDate: event.startDate.toISOString(),
    ...(event.endDate ? { endDate: event.endDate.toISOString() } : {}),
    ...(location
      ? { location: { "@type": "Place", name: location, address: location } }
      : {}),
    ...(image ? { image } : {}),
    url: nonEmpty(event.callToActionLink) ?? shopUrl,
    organizer: { "@type": "Organization", name: event.shop.name, url: shopUrl },
  };
}

export type DiscussionPostSchemaInput = {
  title: string;
  /** Plain-text body (flattened from the Editor.js JSON). */
  text: string;
  authorName: string;
  datePublished: Date;
  dateModified?: Date;
  path: string;
  commentCount: number;
  upvoteCount: number;
};

export function discussionPostSchema(
  post: DiscussionPostSchemaInput,
): WithContext<DiscussionForumPosting> {
  const text = truncate(post.text, 500);

  return {
    "@context": CONTEXT,
    "@type": "DiscussionForumPosting",
    headline: truncate(post.title, 110),
    ...(text ? { text } : {}),
    author: { "@type": "Person", name: post.authorName },
    datePublished: post.datePublished.toISOString(),
    ...(post.dateModified
      ? { dateModified: post.dateModified.toISOString() }
      : {}),
    url: absoluteUrl(post.path),
    mainEntityOfPage: absoluteUrl(post.path),
    isPartOf: { "@id": WEBSITE_ID },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "CommentAction" },
        userInteractionCount: post.commentCount,
      },
      {
        "@type": "InteractionCounter",
        interactionType: { "@type": "LikeAction" },
        userInteractionCount: post.upvoteCount,
      },
    ],
  };
}
