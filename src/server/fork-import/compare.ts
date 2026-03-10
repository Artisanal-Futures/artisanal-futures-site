/**
 * Compare JSON rows to existing DB rows. For auth tables: new by id only. For others: new + updated by field diff.
 */

import type { PrismaClient } from "../../../generated/prisma";
import { getDelegateName, isAuthTable } from "./config";

export const RELATION_KEYS = new Set([
  "user",
  "accounts",
  "sessions",
  "shop",
  "shops",
  "categories",
  "rating",
  "questions",
  "trainingModel",
  "upcycleResult",
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
  "guestSurveys",
  "forumComments",
  "posts",
  "notifications",
  "upcycleResults",
  "variations",
  "modifications",
  "generatedImages",
  "generationSurveys",
  "commentVotes",
  "messagingProfile",
  "subscriptions",
  "trainingDataSet",
  "websiteProvision",
  "Depot",
  "createdSubreddits",
]);

function normalizeValue(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toISOString();
  }
  if (typeof val === "number" && val > 1e10) {
    // Unix timestamp
    return new Date(val * 1000).toISOString();
  }
  if (Array.isArray(val)) return val.map(normalizeValue);
  if (typeof val === "object" && val !== null && !(val instanceof Date)) {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, normalizeValue(v)])
    );
  }
  return val;
}

function rowSignature(row: Record<string, unknown>, skipKeys: Set<string>): string {
  const entries = Object.entries(row)
    .filter(([k]) => !skipKeys.has(k) && !RELATION_KEYS.has(k))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${JSON.stringify(normalizeValue(v))}`);
  return entries.join("|");
}

export type CompareResult =
  | {
      kind: "normal";
      new: Record<string, unknown>[];
      updated: { row: Record<string, unknown>; previous: Record<string, unknown> }[];
      unchangedCount: number;
    }
  | {
      kind: "auth";
      new: Record<string, unknown>[];
      existingIds: string[];
    };

export async function getExistingRows(
  db: PrismaClient,
  tableKey: string,
  ids: string[]
): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) return [];
  const delegateName = getDelegateName(tableKey);
  if (!delegateName) return [];
  const delegate = (db as unknown as Record<string, { findMany: (args: unknown) => Promise<unknown[]> }>)[delegateName];
  if (!delegate?.findMany) return [];
  const rows = await delegate.findMany({
    where: { id: { in: ids } },
  });
  return rows as Record<string, unknown>[];
}

export function compareTable(
  tableKey: string,
  jsonRows: Record<string, unknown>[],
  existingRows: Record<string, unknown>[]
): CompareResult {
  const existingById = new Map<string, Record<string, unknown>>();
  for (const r of existingRows) {
    const id = r.id as string;
    if (id) existingById.set(id, r);
  }

  const skipKeys = new Set(["id"]);

  if (isAuthTable(tableKey)) {
    const newRows: Record<string, unknown>[] = [];
    const existingIds: string[] = [];
    for (const row of jsonRows) {
      const id = row.id as string;
      if (!id) continue;
      if (existingById.has(id)) {
        existingIds.push(id);
      } else {
        newRows.push(row);
      }
    }
    return { kind: "auth", new: newRows, existingIds };
  }

  const newRows: Record<string, unknown>[] = [];
  const updated: { row: Record<string, unknown>; previous: Record<string, unknown> }[] = [];
  let unchangedCount = 0;

  for (const row of jsonRows) {
    const id = row.id as string;
    if (!id) continue;
    const existing = existingById.get(id);
    if (!existing) {
      newRows.push(row);
      continue;
    }
    const sigJson = rowSignature(row, skipKeys);
    const sigExisting = rowSignature(existing, skipKeys);
    if (sigJson === sigExisting) {
      unchangedCount++;
    } else {
      updated.push({ row, previous: existing });
    }
  }

  return {
    kind: "normal",
    new: newRows,
    updated,
    unchangedCount,
  };
}
