import type { CategoryType, PrismaClient } from "generated/prisma";
import { TRPCError } from "@trpc/server";

import type {
  ParseResult,
  ProductCsvRow,
  ServiceCsvRow,
} from "~/lib/csv-import";
import { parseProductRow, parseServiceRow } from "~/lib/csv-import";
import { expandWithParents } from "~/server/api/shared/categories";

/**
 * Server-side analysis for the admin CSV importer.
 *
 * The client has already parsed the file with the same pure schemas, but that
 * check cannot see the database: categories must exist, and a row may collide
 * with something already in the shop or with an earlier row in the same file.
 * This module answers those questions once, and both `preview` and `commit`
 * run it — commit never trusts the statuses the client was shown.
 *
 * Row numbers in messages are 1-based *data* rows (`index + 1`), matching what
 * the preview table shows. They deliberately ignore the header row, so "row 3"
 * means the third product, not spreadsheet line 3.
 */

export type RowStatus = "valid" | "invalid" | "duplicate";

export type DuplicateInfo = {
  /** `existing`: already in the shop. `file`: an earlier row of this upload. */
  kind: "existing" | "file";
  /** Only `name` today: an existing-SKU clash is reported as `invalid`. */
  matchedOn: "name";
  /** Set when `kind` is `existing`. */
  existingId?: string;
  /** 1-based data row number, set when `kind` is `file`. */
  row?: number;
};

/**
 * Admin-chosen replacements for category names the file used but the shop's
 * taxonomy does not have. Keyed by the normalized (trimmed, lowercased) name
 * from the file; the value is an existing category id, or `null` to drop that
 * name from every row that uses it. One choice therefore fixes a repeated typo
 * everywhere at once.
 */
export type CategoryRemaps = Record<string, string | null>;

export type AnalyzeOptions = {
  categoryRemaps?: CategoryRemaps;
};

export type AnalyzedRow<T> = {
  /** 0-based index into the submitted `rows` array. */
  index: number;
  status: RowStatus;
  errors: string[];
  /**
   * Category names from this row that matched nothing (original spelling,
   * deduped). Non-empty only on invalid rows; the UI offers a replacement for
   * each and re-runs the analysis with `categoryRemaps`.
   */
  unknownCategories: string[];
  duplicate?: DuplicateInfo;
  /** `null` only when the row is invalid and therefore cannot be created. */
  normalized: T | null;
  /** Resolved category ids, already expanded with their parents. */
  categoryIds: string[];
};

const normalizeName = (value: string): string => value.trim().toLowerCase();

const assertShopExists = async (db: PrismaClient, shopId: string) => {
  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { id: true },
  });

  if (!shop) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Shop not found" });
  }
};

type CategoryLookup = {
  idByName: Map<string, string>;
  byId: Map<string, { parentId: string | null }>;
};

/** One query for the whole upload, rather than one per row. */
const loadCategories = async (
  db: PrismaClient,
  type: CategoryType,
): Promise<CategoryLookup> => {
  const categories = await db.category.findMany({
    where: { type },
    select: { id: true, name: true, parentId: true },
  });

  const idByName = new Map<string, string>();
  const byId = new Map<string, { parentId: string | null }>();

  for (const category of categories) {
    idByName.set(normalizeName(category.name), category.id);
    byId.set(category.id, { parentId: category.parentId });
  }

  return { idByName, byId };
};

/**
 * Match category names case-insensitively against existing categories. An
 * unrecognised name invalidates the row: the importer never creates
 * categories, since a typo would otherwise quietly fork the taxonomy.
 */
const resolveCategories = (
  names: string[],
  lookup: CategoryLookup,
  kind: "product" | "service",
  remaps: CategoryRemaps,
): { categoryIds: string[]; errors: string[]; unknownCategories: string[] } => {
  const errors: string[] = [];
  const ids: string[] = [];
  const unknown = new Map<string, string>();

  for (const name of names) {
    const key = normalizeName(name);
    const id = lookup.idByName.get(key);
    if (id !== undefined) {
      ids.push(id);
      continue;
    }

    // A remap only counts if the admin pointed at a real category of this
    // type; a stale id (category deleted since the preview) falls through to
    // the normal unknown-category error rather than silently attaching nothing.
    if (key in remaps) {
      const target = remaps[key];
      if (target === null) continue;
      if (target !== undefined && lookup.byId.has(target)) {
        ids.push(target);
        continue;
      }
    }

    if (!unknown.has(key)) unknown.set(key, name);
    errors.push(
      `Unknown category "${name}" (must match an existing ${kind} category)`,
    );
  }

  return {
    categoryIds: expandWithParents(ids, lookup.byId),
    errors,
    unknownCategories: [...unknown.values()],
  };
};

export async function analyzeProductRows(
  db: PrismaClient,
  shopId: string,
  rows: Record<string, string>[],
  options: AnalyzeOptions = {},
): Promise<AnalyzedRow<ProductCsvRow>[]> {
  await assertShopExists(db, shopId);
  const remaps = options.categoryRemaps ?? {};

  const parsed: ParseResult<ProductCsvRow>[] = rows.map((row) =>
    parseProductRow(row),
  );

  const categories = await loadCategories(db, "PRODUCT");

  const existing = await db.product.findMany({
    where: { shopId },
    select: { id: true, name: true, shopProductId: true },
  });

  const existingIdByName = new Map<string, string>();
  const existingIdBySku = new Map<string, string>();

  for (const product of existing) {
    const name = normalizeName(product.name);
    if (!existingIdByName.has(name)) existingIdByName.set(name, product.id);
    if (product.shopProductId && !existingIdBySku.has(product.shopProductId)) {
      existingIdBySku.set(product.shopProductId, product.id);
    }
  }

  // First occurrence within the file wins; later ones are flagged against it.
  const fileRowByName = new Map<string, number>();
  const fileRowBySku = new Map<string, number>();

  return parsed.map((result, index): AnalyzedRow<ProductCsvRow> => {
    if (!result.ok) {
      return {
        index,
        status: "invalid",
        errors: result.errors,
        unknownCategories: [],
        normalized: null,
        categoryIds: [],
      };
    }

    const row = result.data;
    const { categoryIds, errors, unknownCategories } = resolveCategories(
      row.categories,
      categories,
      "product",
      remaps,
    );

    if (errors.length > 0) {
      return {
        index,
        status: "invalid",
        errors,
        unknownCategories,
        normalized: null,
        categoryIds: [],
      };
    }

    const name = normalizeName(row.name);

    const base = {
      index,
      errors: [] as string[],
      unknownCategories: [] as string[],
      normalized: row,
      categoryIds,
    };

    if (row.sku !== null) {
      const existingId = existingIdBySku.get(row.sku);
      if (existingId !== undefined) {
        // Create-only import: an existing SKU can never be inserted again
        // (`@@unique([shopId, shopProductId])`), so this is not overridable.
        return {
          index,
          status: "invalid",
          errors: [
            `sku ${row.sku} already exists in this shop. Leave it blank to auto-generate, or use a different sku.`,
          ],
          unknownCategories: [],
          normalized: null,
          categoryIds: [],
        };
      }

      const earlierRow = fileRowBySku.get(row.sku);
      if (earlierRow !== undefined) {
        // Unlike a name clash this is not a choice: `@@unique([shopId,
        // shopProductId])` would reject the second insert outright.
        return {
          index,
          status: "invalid",
          errors: [`sku ${row.sku} is also used on row ${earlierRow}`],
          unknownCategories: [],
          normalized: null,
          categoryIds: [],
        };
      }

      fileRowBySku.set(row.sku, index + 1);
    }

    const existingId = existingIdByName.get(name);
    if (existingId !== undefined) {
      if (!fileRowByName.has(name)) fileRowByName.set(name, index + 1);
      return {
        ...base,
        status: "duplicate",
        duplicate: { kind: "existing", matchedOn: "name", existingId },
      };
    }

    const earlierRow = fileRowByName.get(name);
    if (earlierRow !== undefined) {
      return {
        ...base,
        status: "duplicate",
        duplicate: { kind: "file", matchedOn: "name", row: earlierRow },
      };
    }

    fileRowByName.set(name, index + 1);

    return { ...base, status: "valid" };
  });
}

export async function analyzeServiceRows(
  db: PrismaClient,
  shopId: string,
  rows: Record<string, string>[],
  options: AnalyzeOptions = {},
): Promise<AnalyzedRow<ServiceCsvRow>[]> {
  await assertShopExists(db, shopId);
  const remaps = options.categoryRemaps ?? {};

  const parsed: ParseResult<ServiceCsvRow>[] = rows.map((row) =>
    parseServiceRow(row),
  );

  const categories = await loadCategories(db, "SERVICE");

  const existing = await db.service.findMany({
    where: { shopId },
    select: { id: true, name: true },
  });

  const existingIdByName = new Map<string, string>();
  for (const service of existing) {
    const name = normalizeName(service.name);
    if (!existingIdByName.has(name)) existingIdByName.set(name, service.id);
  }

  const fileRowByName = new Map<string, number>();

  return parsed.map((result, index): AnalyzedRow<ServiceCsvRow> => {
    if (!result.ok) {
      return {
        index,
        status: "invalid",
        errors: result.errors,
        unknownCategories: [],
        normalized: null,
        categoryIds: [],
      };
    }

    const row = result.data;
    const { categoryIds, errors, unknownCategories } = resolveCategories(
      row.categories,
      categories,
      "service",
      remaps,
    );

    if (errors.length > 0) {
      return {
        index,
        status: "invalid",
        errors,
        unknownCategories,
        normalized: null,
        categoryIds: [],
      };
    }

    const name = normalizeName(row.name);
    const base = {
      index,
      errors: [] as string[],
      unknownCategories: [] as string[],
      normalized: row,
      categoryIds,
    };

    const existingId = existingIdByName.get(name);
    if (existingId !== undefined) {
      if (!fileRowByName.has(name)) fileRowByName.set(name, index + 1);
      return {
        ...base,
        status: "duplicate",
        duplicate: { kind: "existing", matchedOn: "name", existingId },
      };
    }

    const earlierRow = fileRowByName.get(name);
    if (earlierRow !== undefined) {
      return {
        ...base,
        status: "duplicate",
        duplicate: { kind: "file", matchedOn: "name", row: earlierRow },
      };
    }

    fileRowByName.set(name, index + 1);

    return { ...base, status: "valid" };
  });
}
