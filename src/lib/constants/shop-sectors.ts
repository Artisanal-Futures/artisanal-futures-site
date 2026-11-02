/**
 * What a shop mainly does (`Shop.sector`). Unlike `attributeTags` (multi-valued
 * identity tags), a shop has at most one sector, and it colors the shop's pin
 * on the Artisan Map.
 *
 * The `id` slug is what's stored, so labels can be renamed freely; changing
 * or removing an id orphans existing rows (they fall back to "other").
 * Colors are tuned per map theme and always paired with the text label, so
 * no sector is ever told apart by color alone.
 */
export const SHOP_SECTORS = [
  {
    id: "apparel",
    label: "Apparel & Textiles",
    short: "Apparel",
    color: { light: "#a5438d", dark: "#e88ed1" },
  },
  {
    id: "jewelry",
    label: "Jewelry & Accessories",
    short: "Jewelry",
    color: { light: "#9c6600", dark: "#e9bd35" },
  },
  {
    id: "beauty-wellness",
    label: "Beauty & Wellness",
    short: "Beauty",
    color: { light: "#bd4056", dark: "#d37d94" },
  },
  {
    id: "home-goods",
    label: "Home & Handmade Goods",
    short: "Home",
    color: { light: "#be673d", dark: "#ee985a" },
  },
  {
    id: "art-design",
    label: "Art & Design",
    short: "Art",
    color: { light: "#147cc0", dark: "#44b5f7" },
  },
  {
    id: "food-farming",
    label: "Food & Farming",
    short: "Food",
    color: { light: "#32734c", dark: "#5bca9a" },
  },
  {
    id: "education",
    label: "Education & Workshops",
    short: "Education",
    color: { light: "#078277", dark: "#05a999" },
  },
  {
    id: "services",
    label: "Services & Consulting",
    short: "Services",
    color: { light: "#7d36ac", dark: "#8682d9" },
  },
  {
    id: "other",
    label: "Other",
    short: "Other",
    color: { light: "#56606b", dark: "#a7adb5" },
  },
] as const;

export type ShopSector = (typeof SHOP_SECTORS)[number];
export type ShopSectorId = ShopSector["id"];

/** Every sector id, in display order (a tuple, for `z.enum`). */
export const SHOP_SECTOR_IDS = SHOP_SECTORS.map((s) => s.id) as [
  ShopSectorId,
  ...ShopSectorId[],
];

/** Sector a shop without one (or with a retired id) is shown under. */
export const DEFAULT_SHOP_SECTOR: ShopSectorId = "other";

const SECTOR_BY_ID = new Map<string, ShopSector>(
  SHOP_SECTORS.map((s) => [s.id, s]),
);

export const isShopSector = (value: unknown): value is ShopSectorId =>
  typeof value === "string" && SECTOR_BY_ID.has(value);

/** A stored `Shop.sector` as a known id: null or unknown becomes "other". */
export const toShopSector = (value: string | null | undefined): ShopSectorId =>
  isShopSector(value) ? value : DEFAULT_SHOP_SECTOR;

/** The sector entry for an id (unknown → "other"). */
export const getShopSector = (value: string | null | undefined): ShopSector =>
  SECTOR_BY_ID.get(toShopSector(value))!;

/** Display label for a stored sector (unknown or unset → "Other"). */
export const sectorLabel = (value: string | null | undefined): string =>
  getShopSector(value).label;
