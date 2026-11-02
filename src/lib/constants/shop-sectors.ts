/**
 * Code side of shop sectors. The sectors themselves live in the database
 * (`ShopSector`, managed at /admin/sectors); this file holds what stays in
 * code: the color palette admins pick from and the synthetic "Other" that
 * shops without a sector are shown under.
 *
 * Colors are tuned per map theme and always paired with a text label, so no
 * sector is ever told apart by color alone.
 */

export type SectorColor = { light: string; dark: string };

/** The validated light/dark pairs a sector's `colorKey` can name. */
export const SECTOR_PALETTE = [
  { key: "plum", name: "Plum", light: "#a5438d", dark: "#e88ed1" },
  { key: "gold", name: "Gold", light: "#9c6600", dark: "#e9bd35" },
  { key: "rose", name: "Rose", light: "#bd4056", dark: "#d37d94" },
  { key: "terracotta", name: "Terracotta", light: "#be673d", dark: "#ee985a" },
  { key: "blue", name: "Blue", light: "#147cc0", dark: "#44b5f7" },
  { key: "green", name: "Green", light: "#32734c", dark: "#5bca9a" },
  { key: "teal", name: "Teal", light: "#078277", dark: "#05a999" },
  { key: "violet", name: "Violet", light: "#7d36ac", dark: "#8682d9" },
] as const;

export type SectorColorKey = (typeof SECTOR_PALETTE)[number]["key"];

/** Every palette key (a tuple, for `z.enum`). */
export const SECTOR_COLOR_KEYS = SECTOR_PALETTE.map((color) => color.key) as [
  SectorColorKey,
  ...SectorColorKey[],
];

const NEUTRAL_SECTOR_COLOR: SectorColor = { light: "#56606b", dark: "#a7adb5" };

/** A palette key's color pair; an unknown key is the neutral color. */
export function sectorColor(colorKey: string | null | undefined): SectorColor {
  const entry = SECTOR_PALETTE.find((color) => color.key === colorKey);
  return entry
    ? { light: entry.light, dark: entry.dark }
    : NEUTRAL_SECTOR_COLOR;
}

/** Reserved: can't be created, because it means "no sector" on the map. */
export const OTHER_SECTOR_SLUG = "other";

/** Select value for "no sector", since Radix Select can't take an empty one. */
export const NO_SECTOR_VALUE = "none";

/** A sector as the public map shows it. `MapShop.sector` holds its slug. */
export type DisplaySector = {
  slug: string;
  name: string;
  shortName: string;
  color: SectorColor;
};

/** What a shop with `sectorId = null` is shown under. Not a database row. */
export const OTHER_SECTOR: DisplaySector = {
  slug: OTHER_SECTOR_SLUG,
  name: "Other",
  shortName: "Other",
  color: NEUTRAL_SECTOR_COLOR,
};

/** Database sectors, in order, for display; "Other" always comes last. */
export function toDisplaySectors(
  rows: readonly {
    slug: string;
    name: string;
    shortName: string | null;
    colorKey: string;
  }[],
): DisplaySector[] {
  return [
    ...rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      shortName: row.shortName ?? row.name,
      color: sectorColor(row.colorKey),
    })),
    OTHER_SECTOR,
  ];
}

/** The sector with this slug; an unknown slug is "Other". */
export function findSector(
  sectors: readonly DisplaySector[],
  slug: string,
): DisplaySector {
  return sectors.find((sector) => sector.slug === slug) ?? OTHER_SECTOR;
}
