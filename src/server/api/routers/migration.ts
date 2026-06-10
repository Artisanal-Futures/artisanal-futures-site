import { z } from "zod";

import { adminOnlyProcedure, createTRPCRouter } from "~/server/api/trpc";
import { db } from "~/server/db";
import { applyTable } from "~/server/fork-import/apply";
import {
  getExistingRows,
  preflightRefs,
  compareTable as runCompareTable,
} from "~/server/fork-import/compare";
import {
  getDelegateName,
  IMPORTABLE_TABLE_KEYS,
} from "~/server/fork-import/config";

const forkImportTableSchema = z.object({
  tableKey: z.string(),
  rows: z.array(z.record(z.unknown())),
});

const forkApplySchema = z.object({
  tableKey: z.string(),
  new: z.array(z.record(z.unknown())),
  updated: z.array(z.record(z.unknown())),
  // Optional remap of missing referenced ids (user/shop/…) -> existing ids,
  // applied at insert time.
  idRemap: z.record(z.string()).optional(),
});

export const migrationRouter = createTRPCRouter({
  get: adminOnlyProcedure.query(async ({ ctx }) => {
    // Find sessions where the userId doesn't exist in the users table
    const orphanedSessions = await ctx.db.session.findMany({
      where: {
        userId: {
          notIn: (await db.user.findMany()).map((user) => user.id),
        },
      },
    });

    return orphanedSessions;
  }),

  migrateUsernames: adminOnlyProcedure.mutation(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: {
        name: {
          not: null,
        },
      },
    });

    for (const user of users) {
      if (!user.name) continue;

      // Create base username by removing spaces and special chars
      const baseUsername = user.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      let username = baseUsername;
      let usernameExists = true;

      while (usernameExists) {
        // Check if username exists
        const existingUser = await ctx.db.user.findFirst({
          where: {
            username: username,
            id: {
              not: user.id, // Don't match the current user
            },
          },
        });

        if (!existingUser) {
          usernameExists = false;
        } else {
          // Add 4 random digits
          const randomDigits = Math.floor(Math.random() * 9000 + 1000);
          username = `${baseUsername}${randomDigits}`;
        }
      }

      // Update the user with the valid username
      await ctx.db.user.update({
        where: {
          id: user.id,
        },
        data: {
          username,
        },
      });
    }
  }),

  /** Parse fork JSON and return list of tables with counts (only importable keys). Uses mutation so large JSON is sent in body (avoids 431). */
  getForkImportTables: adminOnlyProcedure
    .input(z.object({ json: z.string() }))
    .mutation(({ input }) => {
      const allowlist = new Set(IMPORTABLE_TABLE_KEYS);
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(input.json) as Record<string, unknown>;
      } catch {
        return { tables: [] as { key: string; count: number }[] };
      }
      const tables: { key: string; count: number }[] = [];
      for (const key of Object.keys(data)) {
        if (!allowlist.has(key)) continue;
        const val = data[key];
        const count = Array.isArray(val) ? val.length : 0;
        tables.push({ key, count });
      }
      return { tables };
    }),

  /** Compare JSON rows for one table to current DB; returns new/updated (or for auth, new + existingIds). Uses mutation so large payloads go in request body (avoids 431). */
  compareForkTable: adminOnlyProcedure
    .input(forkImportTableSchema)
    .mutation(async ({ ctx, input }) => {
      if (!getDelegateName(input.tableKey)) {
        return { error: `Unknown or unsupported table: ${input.tableKey}` };
      }
      const existing = await getExistingRows(
        ctx.db,
        input.tableKey,
        input.rows,
      );
      const result = runCompareTable(input.tableKey, input.rows, existing);
      const refPreflight = await preflightRefs(
        ctx.db,
        input.tableKey,
        input.rows,
      );
      return { ...result, refPreflight };
    }),

  /** Apply new/updated rows for one table. Auth tables: new only, with mapping. */
  applyForkTable: adminOnlyProcedure
    .input(forkApplySchema)
    .mutation(async ({ ctx, input }) => {
      return applyTable(
        ctx.db,
        input.tableKey,
        input.new,
        input.updated,
        input.idRemap,
      );
    }),
});
