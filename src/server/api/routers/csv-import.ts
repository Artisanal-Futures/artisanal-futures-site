import { Prisma } from "generated/prisma";
import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { AnalyzedRow } from "~/server/api/shared/csv-import";
import { MAX_IMPORT_ROWS } from "~/lib/csv-import";
import {
  analyzeProductRows,
  analyzeServiceRows,
} from "~/server/api/shared/csv-import";
import { adminOnlyProcedure, createTRPCRouter } from "~/server/api/trpc";

/**
 * Admin-only CSV bulk import.
 *
 * Every procedure is a mutation, including the two previews: a preview carries
 * the whole parsed file, which is far too large for a query string, and it is
 * never cached.
 */

const previewInput = z.object({
  shopId: z.string().min(1),
  /** Header-keyed rows, already normalized and parsed from CSV by the client. */
  rows: z.array(z.record(z.string())).min(1).max(MAX_IMPORT_ROWS),
  /** See `CategoryRemaps`: unknown category name → replacement id, or null to drop. */
  categoryRemaps: z.record(z.string().nullable()).optional(),
});

const commitInput = previewInput.extend({
  /**
   * Indices (into `rows`) of duplicate rows the admin explicitly chose to
   * create anyway. Anything not listed here is skipped.
   */
  createDuplicateIndices: z.array(z.number().int().nonnegative()),
});

const countStatuses = <T>(rows: AnalyzedRow<T>[]) => ({
  valid: rows.filter((row) => row.status === "valid").length,
  duplicate: rows.filter((row) => row.status === "duplicate").length,
  invalid: rows.filter((row) => row.status === "invalid").length,
});

/**
 * Pick the rows to create: everything clean, plus the duplicates the admin
 * ticked. `normalized` is non-null for both statuses, but narrow rather than
 * assert so a future status change cannot silently insert a half-parsed row.
 */
const selectRowsToCreate = <T>(
  rows: AnalyzedRow<T>[],
  createDuplicateIndices: number[],
): { row: AnalyzedRow<T>; normalized: T }[] => {
  const approved = new Set(createDuplicateIndices);

  return rows.flatMap((row) => {
    const include =
      row.status === "valid" ||
      (row.status === "duplicate" && approved.has(row.index));

    if (!include || row.normalized === null) return [];
    return [{ row, normalized: row.normalized }];
  });
};

const skippedDuplicateCount = <T>(
  rows: AnalyzedRow<T>[],
  createDuplicateIndices: number[],
): number => {
  const approved = new Set(createDuplicateIndices);
  return rows.filter(
    (row) => row.status === "duplicate" && !approved.has(row.index),
  ).length;
};

/**
 * A unique-constraint violation here means the shop changed between preview
 * and commit (another admin, another tab). Nothing was written — the whole
 * import is one transaction — so the fix is simply to preview again.
 */
const rethrowImportError = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "A product with the same SKU already exists in this shop. Re-run the preview and try again.",
    });
  }

  throw error;
};

export const csvImportRouter = createTRPCRouter({
  previewProducts: adminOnlyProcedure
    .input(previewInput)
    .mutation(async ({ ctx, input }) => {
      const rows = await analyzeProductRows(ctx.db, input.shopId, input.rows, {
        categoryRemaps: input.categoryRemaps,
      });
      return { rows, counts: countStatuses(rows) };
    }),

  commitProducts: adminOnlyProcedure
    .input(commitInput)
    .mutation(async ({ ctx, input }) => {
      // Re-analyzed rather than trusting the statuses the client was shown.
      const rows = await analyzeProductRows(ctx.db, input.shopId, input.rows, {
        categoryRemaps: input.categoryRemaps,
      });
      const toCreate = selectRowsToCreate(rows, input.createDuplicateIndices);

      if (toCreate.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No rows to import",
        });
      }

      const createdIds = await ctx.db
        .$transaction(
          async (tx) => {
            const ids: string[] = [];

            for (const { row, normalized } of toCreate) {
              const created = await tx.product.create({
                data: {
                  shopId: input.shopId,
                  // A shop-unique code is required by the schema; rows without
                  // a SKU get a synthetic one, matching the manual product form.
                  shopProductId: normalized.sku ?? `af${createId()}`,
                  name: normalized.name,
                  description: normalized.description,
                  priceInCents: normalized.priceInCents,
                  currency: "USD",
                  imageUrl: normalized.imageUrl,
                  productUrl: normalized.productUrl,
                  tags: normalized.tags,
                  attributeTags: normalized.attributeTags,
                  materialTags: normalized.materialTags,
                  environmentalTags: normalized.environmentalTags,
                  aiGeneratedTags: [],
                  scrapeMethod: "MANUAL",
                  manualFields: [],
                  isPublic: normalized.isPublic,
                  isFeatured: false,
                  categories: {
                    connect: row.categoryIds.map((id) => ({ id })),
                  },
                },
                select: { id: true },
              });

              ids.push(created.id);
            }

            return ids;
          },
          { timeout: 60_000, maxWait: 10_000 },
        )
        .catch(rethrowImportError);

      return {
        createdCount: createdIds.length,
        createdIds,
        skippedInvalid: rows.filter((row) => row.status === "invalid").length,
        skippedDuplicates: skippedDuplicateCount(
          rows,
          input.createDuplicateIndices,
        ),
      };
    }),

  previewServices: adminOnlyProcedure
    .input(previewInput)
    .mutation(async ({ ctx, input }) => {
      const rows = await analyzeServiceRows(ctx.db, input.shopId, input.rows, {
        categoryRemaps: input.categoryRemaps,
      });
      return { rows, counts: countStatuses(rows) };
    }),

  commitServices: adminOnlyProcedure
    .input(commitInput)
    .mutation(async ({ ctx, input }) => {
      const rows = await analyzeServiceRows(ctx.db, input.shopId, input.rows, {
        categoryRemaps: input.categoryRemaps,
      });
      const toCreate = selectRowsToCreate(rows, input.createDuplicateIndices);

      if (toCreate.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No rows to import",
        });
      }

      const createdIds = await ctx.db
        .$transaction(
          async (tx) => {
            const ids: string[] = [];

            for (const { row, normalized } of toCreate) {
              const created = await tx.service.create({
                data: {
                  shopId: input.shopId,
                  name: normalized.name,
                  description: normalized.description,
                  priceInCents: normalized.priceInCents,
                  currency: "USD",
                  imageUrl: normalized.imageUrl,
                  durationInMinutes: normalized.durationInMinutes,
                  locationType: normalized.locationType,
                  serviceUrl: normalized.serviceUrl,
                  tags: normalized.tags,
                  attributeTags: normalized.attributeTags,
                  aiGeneratedTags: [],
                  isPublic: normalized.isPublic,
                  isFeatured: false,
                  categories: {
                    connect: row.categoryIds.map((id) => ({ id })),
                  },
                },
                select: { id: true },
              });

              ids.push(created.id);
            }

            return ids;
          },
          { timeout: 60_000, maxWait: 10_000 },
        )
        .catch(rethrowImportError);

      return {
        createdCount: createdIds.length,
        createdIds,
        skippedInvalid: rows.filter((row) => row.status === "invalid").length,
        skippedDuplicates: skippedDuplicateCount(
          rows,
          input.createDuplicateIndices,
        ),
      };
    }),
});
