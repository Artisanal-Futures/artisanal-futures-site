import type { MapShop } from "./types";
import type { CollaborationTag } from "~/lib/constants/collaboration-tags";
import {
  COLLABORATION_TAG_BY_SLUG,
  COLLABORATION_TAGS,
  collaborationTagSlug,
} from "~/lib/constants/collaboration-tags";

/** Which side of a shop's collaboration listing a facet reads. */
export type CollabSide = "offerTags" | "needTags";

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/** Sorts tags into `COLLABORATION_TAGS` order so URLs stay stable. */
function canonical(tags: Iterable<CollaborationTag>): CollaborationTag[] {
  const set = new Set(tags);
  return COLLABORATION_TAGS.filter((tag) => set.has(tag));
}

/** The selection with `tag` switched on or off. */
export function toggleCollabTag(
  current: readonly CollaborationTag[],
  tag: CollaborationTag,
  checked: boolean,
): CollaborationTag[] {
  return canonical(
    checked ? [...current, tag] : current.filter((t) => t !== tag),
  );
}

// ---------------------------------------------------------------------------
// Counting
// ---------------------------------------------------------------------------

/**
 * Shops per tag on one side of the listing. Every tag is present, in
 * `COLLABORATION_TAGS` order and zeros included.
 */
export function countCollabTags(
  shops: Pick<MapShop, "collab">[],
  side: CollabSide,
): Map<CollaborationTag, number> {
  const counts = new Map<CollaborationTag, number>(
    COLLABORATION_TAGS.map((tag) => [tag, 0]),
  );
  for (const shop of shops) {
    for (const tag of new Set(shop.collab?.[side])) {
      const current = counts.get(tag);
      if (current !== undefined) counts.set(tag, current + 1);
    }
  }
  return counts;
}

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

/**
 * Reads `?offers=local-delivery,storage-space` (slugs, not labels). Unknown
 * slugs and duplicates are dropped.
 */
export function parseCollabTags(
  param: string | null | undefined,
): CollaborationTag[] {
  if (!param) return [];
  return canonical(
    param
      .split(",")
      .map((part) => COLLABORATION_TAG_BY_SLUG.get(part.trim()))
      .filter((tag): tag is CollaborationTag => tag !== undefined),
  );
}

/** The param value as slugs, or null (remove it) when nothing is selected. */
export function serializeCollabTags(
  tags: readonly CollaborationTag[],
): string | null {
  const list = canonical(tags);
  return list.length > 0 ? list.map(collaborationTagSlug).join(",") : null;
}
