/**
 * Export production data to production-export.json for use with the fork importer.
 *
 * Usage:
 *   pnpm db:export-prod                  # export all importable tables
 *   pnpm db:export-prod User Account     # export only the listed tables
 *
 * SAFETY: This script is READ-ONLY. It only issues SELECT statements against
 * the production database pointed to by PROD_DATABASE_URL. It never writes,
 * updates, deletes, or alters anything.
 *
 * The JSON keys are PascalCase table names matching what the importer expects.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaClient } from "../generated/prisma";
import { IMPORTABLE_TABLE_KEYS } from "../src/server/fork-import/config";

// ---------------------------------------------------------------------------
// Validate env
// ---------------------------------------------------------------------------
const url = process.env.PROD_DATABASE_URL;
if (!url) {
  console.error("Error: PROD_DATABASE_URL is not set.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Determine which tables to export
// ---------------------------------------------------------------------------
const requestedKeys = process.argv.slice(2);
let tableKeys: string[];

if (requestedKeys.length > 0) {
  const importableSet = new Set(IMPORTABLE_TABLE_KEYS);
  tableKeys = requestedKeys.filter((key) => {
    if (!importableSet.has(key)) {
      console.warn(`Warning: "${key}" is not a known importable table key — skipping.`);
      return false;
    }
    return true;
  });
  if (tableKeys.length === 0) {
    console.error("No valid table keys provided. Exiting.");
    process.exit(1);
  }
} else {
  tableKeys = IMPORTABLE_TABLE_KEYS;
}

// ---------------------------------------------------------------------------
// Connect (READ-ONLY usage — only SELECT statements are issued below)
// ---------------------------------------------------------------------------
const db = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const data: Record<string, unknown[]> = {};
  let total = 0;

  for (const tableKey of tableKeys) {
    try {
      // Raw SQL so we aren't bound to the current (dev) schema shape.
      // Only SELECT — no writes, no mutations.
      const rows = await db.$queryRawUnsafe<unknown[]>(
        `SELECT * FROM "${tableKey}"`,
      );
      data[tableKey] = rows;
      console.log(`${tableKey}: ${rows.length}`);
      total += rows.length;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Warning: could not export "${tableKey}": ${message}`);
      // Continue with remaining tables rather than aborting.
    }
  }

  console.log(`\nTotal rows exported: ${total}`);

  // BigInt-safe serialiser
  const json = JSON.stringify(
    data,
    (_k, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  );

  const outPath = resolve(process.cwd(), "production-export.json");
  writeFileSync(outPath, json, "utf-8");
  console.log(`\nWrote ${outPath}`);
}

main().finally(() => db.$disconnect());
