import type { z } from "zod";

import type { ColumnDef } from "./columns";
import type { ProductCsvRow } from "./product-columns";
import type { ServiceCsvRow } from "./service-columns";

import { PRODUCT_COLUMNS, productRowSchema } from "./product-columns";
import { SERVICE_COLUMNS, serviceRowSchema } from "./service-columns";

export type ImportType = "products" | "services";

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

export function getColumns(type: ImportType): readonly ColumnDef[] {
  return type === "products" ? PRODUCT_COLUMNS : SERVICE_COLUMNS;
}

/**
 * Compare a file's headers against the template.
 *
 * `headers` must already be normalized with `normalizeHeader`. `missing` lists
 * required headers the file does not have (a hard stop); `unknown` lists
 * headers the template does not define (reported, then ignored, so an export
 * with extra columns is still usable).
 */
export function checkHeaders(
  type: ImportType,
  headers: string[],
): { missing: string[]; unknown: string[] } {
  const columns = getColumns(type);
  const present = new Set(headers);
  const known = new Set(columns.map((column) => column.header));

  return {
    missing: columns
      .filter((column) => column.required && !present.has(column.header))
      .map((column) => column.header),
    unknown: headers.filter((header) => !known.has(header)),
  };
}

/** `"price: must be a dollar amount like 24.99"` */
const formatIssues = (error: z.ZodError): string[] =>
  error.issues.map((issue) => {
    const header = issue.path[0];
    return typeof header === "string"
      ? `${header}: ${issue.message}`
      : issue.message;
  });

/**
 * Pull exactly the template's columns out of a raw row.
 *
 * A column the file omitted arrives as `undefined`; every cell parser treats
 * that the same as a blank cell, so a file without `material_tags` still
 * parses instead of failing on a missing key.
 */
const pickCells = (
  columns: readonly ColumnDef[],
  raw: Record<string, string | undefined>,
): Record<string, string> => {
  const cells: Record<string, string> = {};
  for (const column of columns) {
    cells[column.header] = raw[column.header] ?? "";
  }
  return cells;
};

export function parseProductRow(
  raw: Record<string, string | undefined>,
): ParseResult<ProductCsvRow> {
  const result = productRowSchema.safeParse(pickCells(PRODUCT_COLUMNS, raw));
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, errors: formatIssues(result.error) };
}

export function parseServiceRow(
  raw: Record<string, string | undefined>,
): ParseResult<ServiceCsvRow> {
  const result = serviceRowSchema.safeParse(pickCells(SERVICE_COLUMNS, raw));
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, errors: formatIssues(result.error) };
}
