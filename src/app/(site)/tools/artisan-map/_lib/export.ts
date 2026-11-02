import Papa from "papaparse";

import type { MapShop } from "./types";
import type { DisplaySector } from "~/lib/constants/shop-sectors";
import { findSector } from "~/lib/constants/shop-sectors";
import { shopPath } from "~/lib/seo/paths";

/**
 * "Download the data" for the Artisan Map. Built client-side from the shops
 * the page already received, which are public and already privacy-offset on
 * the server, so exporting reveals nothing the map doesn't show.
 *
 * Every exported field is listed explicitly in `toExportRow`; nothing is
 * spread from `MapShop`, so a new (possibly private) field never leaks into
 * the download by accident. Email, phone, owner name and photos are never
 * included.
 */

// ---------------------------------------------------------------------------
// Licence + citation
// ---------------------------------------------------------------------------

/** The data licence, in one place so it's easy to change. */
export const MAP_DATA_LICENSE = {
  name: "CC BY 4.0",
  url: "https://creativecommons.org/licenses/by/4.0/",
} as const;

export const MAP_DATA_PUBLISHER = "Artisanal Futures";
export const MAP_DATA_TITLE = "Artisan Map";

/** A plain-text citation for the dataset, as of `date`. */
export function buildCitation({
  url,
  date = new Date(),
}: {
  /** Absolute URL of the map page. */
  url: string;
  date?: Date;
}): string {
  const accessed = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  return (
    `${MAP_DATA_PUBLISHER} (${date.getUTCFullYear()}). ${MAP_DATA_TITLE} ` +
    `[Data set]. ${url}. Accessed ${accessed}. ` +
    `Licensed under ${MAP_DATA_LICENSE.name} (${MAP_DATA_LICENSE.url}).`
  );
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

/** One exported shop. The keys are the allow-list, in column order. */
export type MapExportRow = {
  id: string;
  name: string;
  sector: string;
  sectorLabel: string;
  locality: string | null;
  /** Pin position: exact for storefronts, otherwise the offset location. */
  lat: number | null;
  lng: number | null;
  precision: MapShop["precision"];
  /** Only for an exact (storefront) pin. */
  streetAddress: string | null;
  website: string | null;
  profileUrl: string;
  attributeTags: string[];
  openToCollaborate: boolean;
  collabOfferTags: string[];
  collabNeedTags: string[];
  productCount: number;
  serviceCount: number;
};

/** Exported columns, in order. Anything not listed here is never exported. */
export const EXPORT_FIELDS = [
  "id",
  "name",
  "sector",
  "sectorLabel",
  "locality",
  "lat",
  "lng",
  "precision",
  "streetAddress",
  "website",
  "profileUrl",
  "attributeTags",
  "openToCollaborate",
  "collabOfferTags",
  "collabNeedTags",
  "productCount",
  "serviceCount",
] as const satisfies readonly (keyof MapExportRow)[];

/** Joins multi-valued cells in the CSV. */
const LIST_SEPARATOR = "; ";

/**
 * Spreadsheet apps run cells starting with these as formulas (CSV injection).
 * Papa's own default only matches single-line values, so a value like
 * "=cmd\nx" would slip past it; this one checks the first character only.
 */
const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * A shop as an export row, from allow-listed fields only. `origin` is the
 * site origin (no trailing slash) used for `profileUrl`; `sectors` gives the
 * sector labels.
 */
export function toExportRow(
  shop: MapShop,
  origin: string,
  sectors: readonly DisplaySector[],
): MapExportRow {
  const location = shop.location;
  return {
    id: shop.id,
    name: shop.name,
    sector: shop.sector,
    sectorLabel: findSector(sectors, shop.sector).name,
    locality: shop.locality,
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    precision: shop.precision,
    streetAddress:
      shop.precision === "exact" ? (shop.streetAddress ?? null) : null,
    website: shop.website,
    profileUrl: `${origin}${shopPath(shop)}`,
    attributeTags: [...shop.attributeTags],
    openToCollaborate: shop.collab !== null,
    collabOfferTags: [...(shop.collab?.offerTags ?? [])],
    collabNeedTags: [...(shop.collab?.needTags ?? [])],
    productCount: shop.productCount,
    serviceCount: shop.serviceCount,
  };
}

// ---------------------------------------------------------------------------
// Formats
// ---------------------------------------------------------------------------

type CsvCell = string | number | boolean | null;

function toCsvCell(value: MapExportRow[keyof MapExportRow]): CsvCell {
  return Array.isArray(value) ? value.join(LIST_SEPARATOR) : value;
}

/** CSV with a header row, guarded against formula injection. */
export function toCsv(
  shops: MapShop[],
  origin: string,
  sectors: readonly DisplaySector[],
): string {
  const data = shops.map((shop) => {
    const row = toExportRow(shop, origin, sectors);
    return EXPORT_FIELDS.map((field) => toCsvCell(row[field]));
  });
  return Papa.unparse(
    { fields: [...EXPORT_FIELDS], data },
    { escapeFormulae: CSV_FORMULA_PREFIX },
  );
}

export type MapExportFeature = GeoJSON.Feature<
  GeoJSON.Point | null,
  Omit<MapExportRow, "lat" | "lng">
>;

/**
 * A GeoJSON FeatureCollection. Shops without a location keep a `null`
 * geometry (valid per RFC 7946) so both formats hold the same shops.
 */
export function toGeoJson(
  shops: MapShop[],
  origin: string,
  sectors: readonly DisplaySector[],
): GeoJSON.FeatureCollection<
  GeoJSON.Point | null,
  Omit<MapExportRow, "lat" | "lng">
> {
  return {
    type: "FeatureCollection",
    features: shops.map((shop): MapExportFeature => {
      const { lat, lng, ...properties } = toExportRow(shop, origin, sectors);
      return {
        type: "Feature",
        id: properties.id,
        geometry:
          lat !== null && lng !== null
            ? { type: "Point", coordinates: [lng, lat] }
            : null,
        properties,
      };
    }),
  };
}

/** Download filename, e.g. `artisan-map-filtered-2026-10-30.csv`. */
export function exportFileName(
  scope: "all" | "filtered",
  format: "csv" | "geojson",
  date = new Date(),
): string {
  return `artisan-map-${scope}-${date.toISOString().slice(0, 10)}.${format}`;
}
