import type { MapShop } from "./types";

/**
 * Sector selection, counts and URL handling for the Artisan Map. Pure: every
 * function takes `slugs`, all the sector slugs in display order (database
 * sectors by `sortOrder`, then "other").
 */

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/** Keeps the known slugs, in `slugs` order, so URLs stay stable. */
function canonical(ids: Iterable<string>, slugs: readonly string[]): string[] {
  const set = new Set(ids);
  return slugs.filter((slug) => set.has(slug));
}

/**
 * The sector selection after clicking a chip. `[]` means "all sectors".
 *
 * - From all, the first click solos the clicked sector.
 * - After that, a click toggles that sector in or out.
 * - Deselecting the last one, or selecting every sector in `universe` (the
 *   chips on screen), goes back to all.
 */
export function nextSectors(
  current: readonly string[],
  clicked: string,
  slugs: readonly string[],
  universe: readonly string[] = slugs,
): string[] {
  if (current.length === 0) return [clicked];

  const next = current.includes(clicked)
    ? current.filter((slug) => slug !== clicked)
    : [...current, clicked];

  if (next.length === 0) return [];
  if (universe.length > 0 && universe.every((slug) => next.includes(slug))) {
    return [];
  }
  return canonical(next, slugs);
}

// ---------------------------------------------------------------------------
// Counting
// ---------------------------------------------------------------------------

/** Shop count per sector. Every sector is present, in order and zeros included. */
export function countSectors(
  shops: Pick<MapShop, "sector">[],
  slugs: readonly string[],
): Map<string, number> {
  const counts = new Map<string, number>(slugs.map((slug) => [slug, 0]));
  for (const shop of shops) {
    const current = counts.get(shop.sector);
    if (current !== undefined) counts.set(shop.sector, current + 1);
  }
  return counts;
}

/**
 * Sectors worth a chip: any with shops, plus selected ones (so a URL can't
 * select a chip nobody can see to turn off). Also the `universe` for
 * `nextSectors`.
 */
export function visibleSectorSlugs(
  totals: Map<string, number>,
  selected: readonly string[],
  slugs: readonly string[],
): string[] {
  return slugs.filter(
    (slug) => (totals.get(slug) ?? 0) > 0 || selected.includes(slug),
  );
}

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

/**
 * Reads `?sectors=food-land,art-culture`. Slugs not in `slugs` and duplicates
 * are dropped, and a list naming every sector collapses to `[]` (all).
 */
export function parseSectors(
  param: string | null | undefined,
  slugs: readonly string[],
): string[] {
  if (!param) return [];
  const ids = canonical(
    param.split(",").map((part) => part.trim()),
    slugs,
  );
  return ids.length === slugs.length ? [] : ids;
}

/** The `sectors` param value, or null (remove it) for all sectors. */
export function serializeSectors(
  ids: readonly string[],
  slugs: readonly string[],
): string | null {
  const list = canonical(ids, slugs);
  return list.length > 0 ? list.join(",") : null;
}
