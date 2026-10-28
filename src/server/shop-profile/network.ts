/**
 * Pure builder for the Shop Profile API's `network` block: the AF member
 * directory (every other public, indexable shop) and upcoming events. No
 * database, no env — the loader hands candidates in, so this can be
 * unit-tested.
 *
 * Distances are computed from the shops' REAL coordinates (home-based and area
 * shops are geocoded to a ZIP/city centroid, never a street), but no other
 * shop's coordinates or ids are ever emitted — only the distance, rounded to
 * 0.1 mi.
 */
import type { ShopCollaborationSource } from "./text";
import type {
  DirectoryShop,
  NetworkEvent,
  ShopProfileLocationType,
  ShopProfileNetwork,
} from "./types";
import type { LatLng } from "~/lib/geo/distance";
import { distanceMiles } from "~/lib/geo/distance";
import { shopPath } from "~/lib/seo/paths";
import {
  blankToNull,
  formatLocality,
} from "~/server/geocoding/approximate-location";

import {
  hasCollaboration,
  plainOrNull,
  toCollaboration,
  uniqueStrings,
} from "./text";
import {
  DIRECTORY_ABOUT_MAX_CHARS,
  DIRECTORY_COLLAB_TEXT_MAX_CHARS,
  DIRECTORY_MAX,
  DIRECTORY_MAX_CATEGORIES,
  DIRECTORY_MAX_SERVICES,
  MAX_NETWORK_EVENTS,
} from "./types";

// ─── Input shapes (what the loader provides) ─────────────────────────────────

export type NetworkSubjectInput = {
  id: string;
  /** Real (un-offset) coordinates. */
  geo: LatLng | null;
};

export type NetworkShopInput = ShopCollaborationSource & {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  state: string | null;
  /** Real (un-offset) coordinates. Used for distance only, never emitted. */
  geo: LatLng | null;
  locationType: ShopProfileLocationType;
  bio: string | null;
  description: string | null;
  attributeTags: string[];
  /** AF categories of their public products + services, most-used first. */
  categories: string[];
  /** Names of their public services, featured first. */
  services: string[];
  /** Public products. */
  productCount: number;
};

export type NetworkEventInput = {
  title: string;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  callToActionLink: string | null;
  shop: Pick<
    NetworkShopInput,
    "id" | "slug" | "name" | "city" | "state" | "geo"
  >;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const round1 = (miles: number) => Math.round(miles * 10) / 10;

/** Category names ordered by how often they occur, then alphabetically. */
export function rankCategories(names: string[]): string[] {
  const counts = new Map<string, number>();
  for (const raw of names) {
    const name = raw.trim();
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name);
}

/** Ascending, nulls last. */
function compareDistance(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

// ─── Directory ───────────────────────────────────────────────────────────────

function toDirectoryShop(
  shop: NetworkShopInput,
  distance: number | null,
  baseUrl: string,
): DirectoryShop {
  return {
    name: shop.name.trim(),
    url: `${baseUrl}${shopPath(shop)}`,
    locality: formatLocality(shop.city, shop.state),
    locationType: shop.locationType,
    distanceMiles: distance === null ? null : round1(distance),
    about:
      plainOrNull(shop.bio, DIRECTORY_ABOUT_MAX_CHARS) ??
      plainOrNull(shop.description, DIRECTORY_ABOUT_MAX_CHARS),
    categories: shop.categories.slice(0, DIRECTORY_MAX_CATEGORIES),
    attributeTags: uniqueStrings(shop.attributeTags),
    services: uniqueStrings(shop.services).slice(0, DIRECTORY_MAX_SERVICES),
    productCount: shop.productCount,
    collaboration: toCollaboration(shop, DIRECTORY_COLLAB_TEXT_MAX_CHARS),
  };
}

/**
 * Every candidate but the subject: shops with a collaboration listing first,
 * then by distance (unknown last), then name. Capped at `DIRECTORY_MAX`.
 */
function directory(
  subject: NetworkSubjectInput,
  shops: NetworkShopInput[],
  baseUrl: string,
) {
  const all = shops
    .filter((shop) => shop.id !== subject.id)
    .map((shop) => {
      const distance =
        subject.geo && shop.geo ? distanceMiles(subject.geo, shop.geo) : null;
      const entry = toDirectoryShop(shop, distance, baseUrl);
      return { entry, distance, open: hasCollaboration(entry.collaboration) };
    })
    .sort(
      (a, b) =>
        Number(b.open) - Number(a.open) ||
        compareDistance(a.distance, b.distance) ||
        a.entry.name.localeCompare(b.entry.name),
    );

  return {
    entries: all.slice(0, DIRECTORY_MAX).map(({ entry }) => entry),
    total: all.length,
  };
}

// ─── Events ──────────────────────────────────────────────────────────────────

function upcomingEvents(
  subject: NetworkSubjectInput,
  events: NetworkEventInput[],
  baseUrl: string,
  now: Date,
): NetworkEvent[] {
  return (
    events
      // Same rule as `event.getUpcomingEvents`; the subject's own events
      // aren't a recommendation.
      .filter(
        (e) =>
          e.startDate.getTime() >= now.getTime() && e.shop.id !== subject.id,
      )
      .map((e) => ({
        event: e,
        distance:
          subject.geo && e.shop.geo
            ? distanceMiles(subject.geo, e.shop.geo)
            : null,
      }))
      .sort(
        (a, b) =>
          (subject.geo ? compareDistance(a.distance, b.distance) : 0) ||
          a.event.startDate.getTime() - b.event.startDate.getTime(),
      )
      .slice(0, MAX_NETWORK_EVENTS)
      .map(({ event, distance }): NetworkEvent => {
        const cta = blankToNull(event.callToActionLink);
        return {
          title: event.title.trim(),
          startsAt: event.startDate.toISOString(),
          endsAt: event.endDate?.toISOString() ?? null,
          url:
            cta && /^https?:\/\//i.test(cta)
              ? cta
              : `${baseUrl}${shopPath(event.shop)}`,
          location: blankToNull(event.location),
          locality: formatLocality(event.shop.city, event.shop.state),
          distanceMiles: distance === null ? null : round1(distance),
          hostShop: blankToNull(event.shop.name),
        };
      })
  );
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export function buildNetwork(
  subject: NetworkSubjectInput,
  shops: NetworkShopInput[],
  events: NetworkEventInput[],
  opts: { baseUrl: string; now: Date },
): { network: ShopProfileNetwork; directoryTotal: number } {
  const { entries, total } = directory(subject, shops, opts.baseUrl);
  return {
    network: {
      directory: entries,
      directoryTruncated: total > entries.length,
      upcomingEvents: upcomingEvents(subject, events, opts.baseUrl, opts.now),
    },
    directoryTotal: total,
  };
}
