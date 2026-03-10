/**
 * Apply new/updated rows to DB. Auth tables: map then create only. Normal tables: create new, update changed.
 */

import type { PrismaClient } from "../../../generated/prisma";

import {
  mapExportAccountToBetterAuth,
  mapExportSessionToBetterAuth,
  mapExportUserToBetterAuth,
  mapExportVerificationToBetterAuth,
} from "./auth-mappers";
import { RELATION_KEYS } from "./compare";
import { getDelegateName, isAuthTable } from "./config";

// Re-export the relation keys set for use when stripping relations from normal rows
const SKIP_KEYS = new Set([
  ...RELATION_KEYS,
  "user",
  "accounts",
  "sessions",
  "rating",
  "questions",
  "trainingModel",
  "upcycleResult",
  "shop",
  "shops",
  "categories",
  "owner",
  "address",
  "websiteProvision",
  "products",
  "services",
  "subreddit",
  "author",
  "post",
  "comment",
  "votes",
  "replies",
  "replyTo",
  "creator",
  "subscribers",
  "comments",
  "profile",
]);

function stripRelationKeys(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (SKIP_KEYS.has(k)) continue;
    if (v === undefined) continue;
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
      out[k] = new Date(v);
    } else if (typeof v === "number" && v > 1e10 && v < 2e12) {
      out[k] = new Date(v * 1000);
    } else if (Array.isArray(v) && typeof v[0] !== "object") {
      out[k] = v;
    } else if (
      typeof v === "object" &&
      v !== null &&
      !Array.isArray(v) &&
      !(v instanceof Date)
    ) {
      out[k] = v; // JSON/object field
    } else {
      out[k] = v;
    }
  }
  return out;
}

function mapAuthRow(
  tableKey: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  switch (tableKey) {
    case "User":
      return mapExportUserToBetterAuth(row);
    case "Account":
      return mapExportAccountToBetterAuth(row);
    case "Session":
      return mapExportSessionToBetterAuth(row);
    case "VerificationToken":
      return mapExportVerificationToBetterAuth(row);
    default:
      return row;
  }
}

export type ApplyResult = {
  created: number;
  updated: number;
  errors: { id: string; message: string }[];
};

export async function applyTable(
  db: PrismaClient,
  tableKey: string,
  newRows: Record<string, unknown>[],
  updatedRows: Record<string, unknown>[],
): Promise<ApplyResult> {
  const delegateName = getDelegateName(tableKey);
  if (!delegateName) {
    return {
      created: 0,
      updated: 0,
      errors: [{ id: "", message: `Unknown table: ${tableKey}` }],
    };
  }

  const delegate = db as unknown as Record<
    string,
    {
      create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
      update: (args: {
        where: { id: string };
        data: Record<string, unknown>;
      }) => Promise<unknown>;
    }
  >;
  const model = delegate[delegateName];
  if (!model?.create || !model?.update) {
    return {
      created: 0,
      updated: 0,
      errors: [
        { id: "", message: `Prisma delegate not found: ${delegateName}` },
      ],
    };
  }

  const errors: { id: string; message: string }[] = [];
  let created = 0;
  let updated = 0;
  const isAuth = isAuthTable(tableKey);

  for (const row of newRows) {
    const id = row.id as string;
    try {
      const data = isAuth ? mapAuthRow(tableKey, row) : stripRelationKeys(row);
      await model.create({ data });
      created++;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push({ id: id ?? "?", message });
    }
  }

  if (!isAuth) {
    for (const row of updatedRows) {
      const id = row.id as string;
      try {
        const data = stripRelationKeys(row);
        delete data.id;
        await model.update({ where: { id }, data });
        updated++;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push({ id: id ?? "?", message });
      }
    }
  }

  return { created, updated, errors };
}
