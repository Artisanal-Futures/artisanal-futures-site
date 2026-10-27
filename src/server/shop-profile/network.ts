/**
 * Pure ranking for the Shop Profile API's `network` block: which other AF
 * shops and events to recommend to the subject shop. No database, no env —
 * the loader hands candidates in, so this can be unit-tested.
 *
 * Distances are computed from the shops' REAL coordinates (home-based and area
 * shops are geocoded to a ZIP/city centroid, never a street), but no other
 * shop's coordinates are ever emitted — only the distance, rounded to 0.1 mi.
 *
 * A shop may appear in more than one group.
 */
import type { NetworkEvent, NetworkShop, ShopProfileNetwork } from "./types";
import type { LatLng } from "~/lib/geo/distance";
import { distanceMiles } from "~/lib/geo/distance";
import { shopPath } from "~/lib/seo/paths";
import {
  blankToNull,
  formatLocality,
} from "~/server/geocoding/approximate-location";

import {
  MAX_NETWORK_CATEGORIES,
  MAX_NETWORK_ITEMS,
  NEARBY_RADIUS_MILES,
} from "./types";

// ─── Input shapes (what the loader provides) ─────────────────────────────────

export type NetworkSubjectInput = {
  id: string;
  /** Real (un-offset) coordinates. */
  geo: LatLng | null;
  state: string | null;
  attributeTags: string[];
  /** Every AF category on the subject's public products + services. */
  categories: string[];
};

export type NetworkShopInput = {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  state: string | null;
  /** Real (un-offset) coordinates. Used for distance only, never emitted. */
  geo: LatLng | null;
  attributeTags: string[];
  /** AF categories of their public products + services, most-used first. */
  categories: string[];
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

const key = (value: string) => value.trim().toLowerCase();

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

function formatMiles(miles: number): string {
  return miles < 0.1 ? "under 0.1 mi" : `${round1(miles)} mi`;
}

/** "a", "a and b", "a, b and c". */
function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of tags) {
    const t = blankToNull(tag);
    if (!t || seen.has(key(t))) continue;
    seen.add(key(t));
    out.push(t);
  }
  return out;
}

/** Ascending, nulls last. */
function compareDistance(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

type Scored = {
  shop: NetworkShopInput;
  distance: number | null;
};

function toNetworkShop(
  { shop, distance }: Scored,
  reason: string,
  baseUrl: string,
): NetworkShop {
  return {
    name: shop.name.trim(),
    url: `${baseUrl}${shopPath(shop)}`,
    locality: formatLocality(shop.city, shop.state),
    distanceMiles: distance === null ? null : round1(distance),
    attributeTags: uniqueTags(shop.attributeTags),
    categories: shop.categories.slice(0, MAX_NETWORK_CATEGORIES),
    reason,
  };
}

const byDistanceThenName = (a: Scored, b: Scored) =>
  compareDistance(a.distance, b.distance) ||
  a.shop.name.localeCompare(b.shop.name);

// ─── Groups ──────────────────────────────────────────────────────────────────

function nearby(scored: Scored[], baseUrl: string): NetworkShop[] {
  return scored
    .filter(
      (s): s is Scored & { distance: number } =>
        s.distance !== null && s.distance <= NEARBY_RADIUS_MILES,
    )
    .sort(byDistanceThenName)
    .slice(0, MAX_NETWORK_ITEMS)
    .map((s) => toNetworkShop(s, `${formatMiles(s.distance)} away`, baseUrl));
}

function sharedValues(
  subject: NetworkSubjectInput,
  scored: Scored[],
  baseUrl: string,
): NetworkShop[] {
  const subjectTags = uniqueTags(subject.attributeTags);
  if (subjectTags.length === 0) return [];

  return scored
    .map((s) => {
      const theirs = new Set(s.shop.attributeTags.map(key));
      // Subject's spelling + order, so the reason reads consistently.
      return { ...s, shared: subjectTags.filter((t) => theirs.has(key(t))) };
    })
    .filter((s) => s.shared.length > 0)
    .sort(
      (a, b) => b.shared.length - a.shared.length || byDistanceThenName(a, b),
    )
    .slice(0, MAX_NETWORK_ITEMS)
    .map((s) => toNetworkShop(s, `Shares ${listJoin(s.shared)}`, baseUrl));
}

function complementary(
  subject: NetworkSubjectInput,
  scored: Scored[],
  baseUrl: string,
): NetworkShop[] {
  const subjectState = subject.state ? key(subject.state) : null;
  // Without coordinates, "local" falls back to the same state.
  const isLocal = subject.geo
    ? (s: Scored) => s.distance !== null && s.distance <= NEARBY_RADIUS_MILES
    : subjectState
      ? (s: Scored) => !!s.shop.state && key(s.shop.state) === subjectState
      : null;
  if (!isLocal) return [];

  const mine = new Set(subject.categories.map(key));

  return scored
    .filter(
      (s) =>
        isLocal(s) &&
        s.shop.categories.length > 0 &&
        s.shop.categories.every((c) => !mine.has(key(c))),
    )
    .sort(byDistanceThenName)
    .slice(0, MAX_NETWORK_ITEMS)
    .map((s) => {
      const makes = listJoin(
        s.shop.categories.slice(0, 2).map((c) => c.toLowerCase()),
      );
      const who = subject.geo
        ? `Nearby ${makes} maker`
        : `${makes.charAt(0).toUpperCase()}${makes.slice(1)} maker also in ${subject.state?.trim()}`;
      return toNetworkShop(
        s,
        `${who} — no overlap with your categories`,
        baseUrl,
      );
    });
}

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
      .slice(0, MAX_NETWORK_ITEMS)
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
): ShopProfileNetwork {
  const scored: Scored[] = shops
    .filter((shop) => shop.id !== subject.id)
    .map((shop) => ({
      shop,
      distance:
        subject.geo && shop.geo ? distanceMiles(subject.geo, shop.geo) : null,
    }));

  return {
    nearby: nearby(scored, opts.baseUrl),
    sharedValues: sharedValues(subject, scored, opts.baseUrl),
    complementary: complementary(subject, scored, opts.baseUrl),
    upcomingEvents: upcomingEvents(subject, events, opts.baseUrl, opts.now),
  };
}
