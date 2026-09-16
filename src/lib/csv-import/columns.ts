import { z } from "zod";

/**
 * Shared vocabulary for the admin CSV bulk importer.
 *
 * Everything in `~/lib/csv-import` is pure: no Prisma, no server imports, no
 * `~/env`. The browser parses the uploaded file with these same schemas so the
 * artisan sees their mistakes before anything is sent, and the server re-runs
 * them because a client-side check is never a guarantee.
 */

/** Hard ceiling on data rows in a single upload. Keeps one transaction small. */
export const MAX_IMPORT_ROWS = 500;

/** Separator for multi-value cells (tags, categories). Commas are taken by CSV. */
export const LIST_SEPARATOR = "|";

export type ColumnDef = {
  /** Normalized header exactly as it appears in the template's first row. */
  header: string;
  required: boolean;
  /** Artisan-facing format hint, shown in the UI and in the docs table. */
  description: string;
  /** Two sample cell values, one per template example row. */
  examples: readonly [string, string];
};

/**
 * Normalize a header cell so hand-edited files still line up.
 *
 * Strips a UTF-8 BOM (Excel writes one on the first header), trims, lowercases,
 * and collapses runs of spaces and hyphens into single underscores — so
 * "Image URL", "image-url" and "IMAGE  URL" all become `image_url`.
 */
export function normalizeHeader(h: string): string {
  return h
    .replace(/\uFEFF/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/**
 * Coerce any cell value to a trimmed string.
 *
 * A column the file omitted arrives as `undefined`, and a spreadsheet library
 * may hand back a number or boolean; all of those are normalized here so every
 * parser below only ever sees a trimmed string. Anything else (an object,
 * which no CSV parser produces) is treated as a blank cell, which required
 * columns then reject.
 */
const asText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
};

const text = z.preprocess(asText, z.string());

/** Non-empty after trimming. */
export const requiredText = z.preprocess(
  asText,
  z.string().min(1, "is required").max(5000, "is too long"),
);

/** Blank cell becomes `null` rather than an empty string. */
export const optionalText = text
  .pipe(z.string().max(5000, "is too long"))
  .transform((value): string | null => (value === "" ? null : value));

/** Dollars in the sheet, integer cents in the database. */
const MAX_PRICE_DOLLARS = 1_000_000;

export const priceDollarsToCents = text.transform((raw, ctx): number | null => {
  if (raw === "") return null;

  // Tolerate what a spreadsheet's currency formatting leaves behind.
  const cleaned = raw.replace(/[$,\s]/g, "");

  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "must be a dollar amount like 24.99",
    });
    return z.NEVER;
  }

  const dollars = Number(cleaned);

  if (!Number.isFinite(dollars) || dollars > MAX_PRICE_DOLLARS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `must be ${MAX_PRICE_DOLLARS.toLocaleString("en-US")} dollars or less`,
    });
    return z.NEVER;
  }

  return Math.round(dollars * 100);
});

const MAX_POSITIVE_INT = 100_000;

/** Whole number, zero or more. Blank becomes `null`. */
export const positiveInt = text.transform((raw, ctx): number | null => {
  if (raw === "") return null;

  const cleaned = raw.replace(/[,\s]/g, "");

  if (!/^\d+$/.test(cleaned)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "must be a whole number like 60",
    });
    return z.NEVER;
  }

  const value = Number(cleaned);

  if (!Number.isFinite(value) || value > MAX_POSITIVE_INT) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `must be ${MAX_POSITIVE_INT.toLocaleString("en-US")} or less`,
    });
    return z.NEVER;
  }

  return value;
});

/**
 * Links are stored verbatim, so they must be https — an http image would be
 * blocked as mixed content once the storefront renders it.
 */
export const httpsUrl = text.transform((raw, ctx): string | null => {
  if (raw === "") return null;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "must be a full link starting with https://",
    });
    return z.NEVER;
  }

  if (parsed.protocol !== "https:") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "must start with https:// (not http://)",
    });
    return z.NEVER;
  }

  return raw;
});

/**
 * `"mug | stoneware ||mug"` becomes `["mug", "stoneware"]`.
 *
 * Deduping is case-sensitive and keeps the first spelling seen, because tags
 * are free text the artisan chose and "Mug" vs "mug" may both be deliberate.
 */
export const pipeList = text.transform((raw): string[] => {
  if (raw === "") return [];

  const seen = new Set<string>();
  const values: string[] = [];

  for (const part of raw.split(LIST_SEPARATOR)) {
    const value = part.trim();
    if (value === "" || seen.has(value)) continue;
    seen.add(value);
    values.push(value);
  }

  return values;
});

const TRUE_VALUES = new Set(["true", "yes", "1", "y"]);
const FALSE_VALUES = new Set(["false", "no", "0", "n"]);

/** Blank falls back to `defaultValue`; anything unrecognised is an error. */
export function boolean(defaultValue: boolean) {
  return text.transform((raw, ctx): boolean => {
    if (raw === "") return defaultValue;

    const value = raw.toLowerCase();
    if (TRUE_VALUES.has(value)) return true;
    if (FALSE_VALUES.has(value)) return false;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "must be true or false",
    });
    return z.NEVER;
  });
}
