import "server-only";

import { unstable_cache } from "next/cache";

import { slugify } from "~/lib/utils";
import { db } from "~/server/db";

/**
 * Data behind the programmatic landing pages /shops/in/{place} and
 * /shops/tag/{tag}. A page only exists when at least this many public shops
 * match, so thin, near-empty pages never reach the index.
 */
export const MIN_SHOPS_PER_LANDING_PAGE = 3;

export const SHOPS_LANDING_TAG = "shops-landing";

const REVALIDATE_SECONDS = 3600;

const US_STATES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const STATE_ABBR_BY_NAME = new Map(
  Object.entries(US_STATES).map(([abbr, name]) => [name.toLowerCase(), abbr]),
);

/** "mi", "MI", "Michigan" -> { abbr: "MI", name: "Michigan" }; else null. */
function matchUsState(raw: string) {
  const cleaned = raw.replace(/\./g, "").trim();
  const upper = cleaned.toUpperCase();
  const abbr =
    upper in US_STATES ? upper : STATE_ABBR_BY_NAME.get(cleaned.toLowerCase());
  return abbr ? { abbr, name: US_STATES[abbr]! } : null;
}

/** "mi" -> "michigan"; any other slug comes back unchanged. */
export function canonicalStateSlug(slug: string) {
  const state = matchUsState(slug);
  return state ? slugify(state.name) : slug;
}

/** What ShopCard renders, plus the facts the landing pages group by. */
export type LandingShop = {
  id: string;
  slug: string | null;
  name: string;
  ownerName: string;
  ownerPhoto: string | null;
  logoPhoto: string | null;
  website: string | null;
  attributeTags: string[];
  categories: string[];
  city: string | null;
  state: string | null;
};

/** Public + indexable shops; the same rule the sitemap uses. */
const loadShops = unstable_cache(
  async (): Promise<LandingShop[]> => {
    const shops = await db.shop.findMany({
      where: { isPublic: true, seoNoIndex: false },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        ownerName: true,
        ownerPhoto: true,
        logoPhoto: true,
        website: true,
        attributeTags: true,
        address: { select: { city: true, state: true } },
        products: {
          where: { isPublic: true },
          select: { categories: { select: { name: true } } },
        },
        services: {
          where: { isPublic: true },
          select: { categories: { select: { name: true } } },
        },
      },
    });

    return shops.map((shop) => ({
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      ownerName: shop.ownerName,
      ownerPhoto: shop.ownerPhoto,
      logoPhoto: shop.logoPhoto,
      website: shop.website,
      attributeTags: shop.attributeTags,
      city: shop.address?.city?.trim() ?? null,
      state: shop.address?.state?.trim() ?? null,
      categories: [
        ...new Set(
          [...shop.products, ...shop.services].flatMap((item) =>
            item.categories.map((category) => category.name),
          ),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    }));
  },
  ["shops-landing"],
  { tags: [SHOPS_LANDING_TAG], revalidate: REVALIDATE_SECONDS },
);

export type LandingPlace = {
  slug: string;
  kind: "city" | "state";
  /** "Detroit, MI" or "Michigan". */
  name: string;
  path: string;
  count: number;
};

export type LandingTag = {
  slug: string;
  /** The tag as stored, e.g. "Black Owned". */
  name: string;
  path: string;
  count: number;
};

type PlaceKeys = {
  state: { slug: string; name: string } | null;
  city: { slug: string; name: string } | null;
};

/** The state and city pages a shop would belong to, from its raw address. */
function placeKeys(shop: {
  city?: string | null;
  state?: string | null;
}): PlaceKeys {
  const rawState = shop.state?.trim();
  if (!rawState) return { state: null, city: null };

  const us = matchUsState(rawState);
  const stateSlug = slugify(us?.name ?? rawState);
  if (!stateSlug) return { state: null, city: null };

  const stateLabel = us?.abbr ?? rawState;
  const rawCity = shop.city?.trim();
  const citySlug = rawCity ? slugify(`${rawCity} ${stateLabel}`) : "";

  return {
    state: { slug: stateSlug, name: us?.name ?? rawState },
    city:
      rawCity && citySlug
        ? { slug: citySlug, name: `${rawCity}, ${stateLabel}` }
        : null,
  };
}

function groupPlaces(shops: LandingShop[]) {
  const places = new Map<
    string,
    { kind: "city" | "state"; names: Map<string, number>; shops: LandingShop[] }
  >();

  const add = (
    kind: "city" | "state",
    key: { slug: string; name: string },
    shop: LandingShop,
  ) => {
    const entry = places.get(key.slug) ?? {
      kind,
      names: new Map<string, number>(),
      shops: [],
    };
    entry.names.set(key.name, (entry.names.get(key.name) ?? 0) + 1);
    entry.shops.push(shop);
    places.set(key.slug, entry);
  };

  for (const shop of shops) {
    const keys = placeKeys(shop);
    if (keys.state) add("state", keys.state, shop);
    if (keys.city) add("city", keys.city, shop);
  }

  return places;
}

/** The most common spelling wins when shops typed a city differently. */
function mostCommon(names: Map<string, number>) {
  return [...names.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

function byCountThenName<T extends { count: number; name: string }>(
  a: T,
  b: T,
) {
  return b.count - a.count || a.name.localeCompare(b.name);
}

/** Every city and state with at least MIN_SHOPS_PER_LANDING_PAGE shops. */
export async function getLocationLandingPages(): Promise<LandingPlace[]> {
  const places = groupPlaces(await loadShops());

  return [...places.entries()]
    .filter(([, place]) => place.shops.length >= MIN_SHOPS_PER_LANDING_PAGE)
    .map(([slug, place]) => ({
      slug,
      kind: place.kind,
      name: mostCommon(place.names),
      path: `/shops/in/${slug}`,
      count: place.shops.length,
    }))
    .sort(byCountThenName);
}

function groupTags(shops: LandingShop[]) {
  const tags = new Map<string, { name: string; shops: LandingShop[] }>();
  for (const shop of shops) {
    for (const tag of new Set(shop.attributeTags)) {
      const slug = slugify(tag);
      if (!slug) continue;
      const entry = tags.get(slug) ?? { name: tag.trim(), shops: [] };
      entry.shops.push(shop);
      tags.set(slug, entry);
    }
  }
  return tags;
}

/** Every attribute tag with at least MIN_SHOPS_PER_LANDING_PAGE shops. */
export async function getTagLandingPages(): Promise<LandingTag[]> {
  const tags = groupTags(await loadShops());

  return [...tags.entries()]
    .filter(([, tag]) => tag.shops.length >= MIN_SHOPS_PER_LANDING_PAGE)
    .map(([slug, tag]) => ({
      slug,
      name: tag.name,
      path: `/shops/tag/${slug}`,
      count: tag.shops.length,
    }))
    .sort(byCountThenName);
}

export type PlaceLanding = { place: LandingPlace; shops: LandingShop[] };
export type TagLanding = { tag: LandingTag; shops: LandingShop[] };

/** The shops for a place slug, or null if it doesn't qualify. */
export async function getShopsForPlace(
  slug: string,
): Promise<PlaceLanding | null> {
  const entry = groupPlaces(await loadShops()).get(slug);
  if (!entry || entry.shops.length < MIN_SHOPS_PER_LANDING_PAGE) return null;

  return {
    place: {
      slug,
      kind: entry.kind,
      name: mostCommon(entry.names),
      path: `/shops/in/${slug}`,
      count: entry.shops.length,
    },
    shops: entry.shops,
  };
}

/** The shops for a tag slug, or null if it doesn't qualify. */
export async function getShopsForTag(slug: string): Promise<TagLanding | null> {
  const entry = groupTags(await loadShops()).get(slug);
  if (!entry || entry.shops.length < MIN_SHOPS_PER_LANDING_PAGE) return null;

  return {
    tag: {
      slug,
      name: entry.name,
      path: `/shops/tag/${slug}`,
      count: entry.shops.length,
    },
    shops: entry.shops,
  };
}

/**
 * The landing pages a shop can link to: its city page (else its state page)
 * and a page for each of its tags, but only the ones that qualify. Never
 * throws; a shop page must render even if this lookup fails.
 */
export async function getShopLandingLinks(shop: {
  city?: string | null;
  state?: string | null;
  attributeTags: string[];
}): Promise<{ locationPath: string | null; tagPaths: Record<string, string> }> {
  try {
    const [places, tags] = await Promise.all([
      getLocationLandingPages(),
      getTagLandingPages(),
    ]);
    const keys = placeKeys(shop);

    const qualifying = new Set(places.map((place) => place.slug));
    const location =
      [keys.city, keys.state].find((key) => key && qualifying.has(key.slug)) ??
      null;

    const tagPaths: Record<string, string> = {};
    for (const tag of shop.attributeTags) {
      const match = tags.find((candidate) => candidate.slug === slugify(tag));
      if (match) tagPaths[tag] = match.path;
    }

    return {
      locationPath: location ? `/shops/in/${location.slug}` : null,
      tagPaths,
    };
  } catch (error) {
    console.error("[seo] failed to load landing links", error);
    return { locationPath: null, tagPaths: {} };
  }
}

/** Shop-count ranked categories, for the generated intro paragraph. */
export function topCategories(shops: LandingShop[], limit = 5) {
  const counts = new Map<string, number>();
  for (const shop of shops) {
    for (const category of shop.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name]) => name);
}
