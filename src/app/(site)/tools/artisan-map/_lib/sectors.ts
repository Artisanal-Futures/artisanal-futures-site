import type { MapShop } from "./types";
import type { ShopSectorId } from "~/lib/constants/shop-sectors";
import { isShopSector, SHOP_SECTOR_IDS } from "~/lib/constants/shop-sectors";

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/** Sorts ids into `SHOP_SECTOR_IDS` order so URLs stay stable. */
function canonical(ids: Iterable<ShopSectorId>): ShopSectorId[] {
  const set = new Set(ids);
  return SHOP_SECTOR_IDS.filter((id) => set.has(id));
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
  current: readonly ShopSectorId[],
  clicked: ShopSectorId,
  universe: readonly ShopSectorId[] = SHOP_SECTOR_IDS,
): ShopSectorId[] {
  if (current.length === 0) return [clicked];

  const next = current.includes(clicked)
    ? current.filter((id) => id !== clicked)
    : [...current, clicked];

  if (next.length === 0) return [];
  if (universe.length > 0 && universe.every((id) => next.includes(id))) {
    return [];
  }
  return canonical(next);
}

// ---------------------------------------------------------------------------
// Counting
// ---------------------------------------------------------------------------

/**
 * Shop count per sector. Every sector is present, in `SHOP_SECTORS` order and
 * zeros included.
 */
export function countSectors(
  shops: Pick<MapShop, "sector">[],
): Map<ShopSectorId, number> {
  const counts = new Map<ShopSectorId, number>(
    SHOP_SECTOR_IDS.map((id) => [id, 0]),
  );
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
export function visibleSectorIds(
  totals: Map<ShopSectorId, number>,
  selected: readonly ShopSectorId[],
): ShopSectorId[] {
  return SHOP_SECTOR_IDS.filter(
    (id) => (totals.get(id) ?? 0) > 0 || selected.includes(id),
  );
}

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

/**
 * Reads `?sectors=food-farming,art-design`. Unknown ids and duplicates are
 * dropped, and a list naming every sector collapses to `[]` (all).
 */
export function parseSectors(param: string | null | undefined): ShopSectorId[] {
  if (!param) return [];
  const ids = canonical(
    param
      .split(",")
      .map((part) => part.trim())
      .filter(isShopSector),
  );
  return ids.length === SHOP_SECTOR_IDS.length ? [] : ids;
}

/** The `sectors` param value, or null (remove it) for all sectors. */
export function serializeSectors(ids: readonly ShopSectorId[]): string | null {
  const list = canonical(ids);
  return list.length > 0 ? list.join(",") : null;
}
