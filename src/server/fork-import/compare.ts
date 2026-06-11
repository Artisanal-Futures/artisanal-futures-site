/**
 * Compare JSON rows to existing DB rows. For auth tables: new by id only. For others: new + updated by field diff.
 */

import type { PrismaClient } from "../../../generated/prisma";
import {
  getCompositeKeyFields,
  getDelegateName,
  isAuthTable,
} from "./config";
import { getRefFields } from "./field-filter";

/** One referenced model (e.g. User, Shop) that has rows missing from the DB. */
export type RefGroup = {
  /** Referenced model name, e.g. "User" or "Shop". */
  model: string;
  /** FK fields on the importing table that reference this model (e.g. ["shopId"]). */
  fields: string[];
  /** Referenced ids NOT in the DB, with how many rows reference each. */
  missing: { id: string; count: number }[];
  /** Existing rows of this model to reassign to. */
  candidates: { id: string; label: string }[];
};

export type RefPreflight = { groups: RefGroup[] };

/**
 * Per referenced model we can resolve: its Prisma delegate, the columns to select,
 * and how to label a candidate row in the reassignment dropdown.
 */
const REF_RESOLVERS: Record<
  string,
  {
    delegate: "user" | "shop";
    select: Record<string, boolean>;
    label: (row: Record<string, unknown>) => string;
  }
> = {
  User: {
    delegate: "user",
    select: { id: true, name: true, email: true },
    label: (r) => {
      const name = typeof r.name === "string" ? r.name : null;
      const email = typeof r.email === "string" ? r.email : null;
      const id = String(r.id);
      if (name) return email ? `${name} (${email})` : name;
      return email ?? id;
    },
  },
  Shop: {
    delegate: "shop",
    select: { id: true, name: true, ownerName: true },
    label: (r) => {
      const name = typeof r.name === "string" ? r.name : null;
      const owner = typeof r.ownerName === "string" ? r.ownerName : null;
      const id = String(r.id);
      if (name) return owner ? `${name} (${owner})` : name;
      return owner ?? id;
    },
  },
};

/**
 * Inspect the rows for a table and find foreign-key references (users, shops, …)
 * that don't exist in the DB yet, grouped by referenced model, so the importer
 * can surface them and let the admin reassign each to an existing row.
 */
export async function preflightRefs(
  db: PrismaClient,
  tableKey: string,
  rows: Record<string, unknown>[],
): Promise<RefPreflight> {
  // Group this table's FK fields by referenced model (only models we can resolve).
  const fieldsByModel = new Map<string, string[]>();
  for (const { field, model } of getRefFields(tableKey)) {
    if (!REF_RESOLVERS[model]) continue;
    const arr = fieldsByModel.get(model) ?? [];
    arr.push(field);
    fieldsByModel.set(model, arr);
  }
  if (fieldsByModel.size === 0) return { groups: [] };

  const delegates = db as unknown as Record<
    string,
    { findMany: (args: unknown) => Promise<Record<string, unknown>[]> }
  >;

  const groups: RefGroup[] = [];
  for (const [model, fields] of fieldsByModel) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      for (const f of fields) {
        const v = row[f];
        if (typeof v === "string" && v.length > 0) {
          counts.set(v, (counts.get(v) ?? 0) + 1);
        }
      }
    }
    const referenced = [...counts.keys()];
    if (referenced.length === 0) continue;

    const resolver = REF_RESOLVERS[model];
    if (!resolver) continue;
    const delegate = delegates[resolver.delegate];
    if (!delegate) continue;
    const existing = await delegate.findMany({
      where: { id: { in: referenced } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((r) => r.id as string));
    const missing = referenced
      .filter((id) => !existingIds.has(id))
      .map((id) => ({ id, count: counts.get(id) ?? 0 }));
    if (missing.length === 0) continue;

    const candidateRows = await delegate.findMany({
      select: resolver.select,
      orderBy: { createdAt: "asc" },
    });
    const candidates = candidateRows.map((r) => ({
      id: r.id as string,
      label: resolver.label(r),
    }));

    groups.push({ model, fields, missing, candidates });
  }

  return { groups };
}

/** Separator for synthetic composite ids. Unlikely to appear in cuid/uuid values. */
const COMPOSITE_ID_SEP = "::";

/**
 * Build a synthetic `id` from a row's composite key fields, or null if any are
 * missing. Used so composite-key tables (Vote, CommentVote, Subscription — which
 * have no real `id` column) can flow through the rest of the id-based pipeline
 * and the row-selection UI. The synthetic id is stripped again before insert by
 * `filterToKnownFields` (the models have no `id` field).
 */
export function compositeIdString(
  fields: string[],
  row: Record<string, unknown>,
): string | null {
  const parts: string[] = [];
  for (const f of fields) {
    const v = row[f];
    if (v === null || v === undefined) return null;
    parts.push(
      typeof v === "string"
        ? v
        : typeof v === "number" || typeof v === "boolean"
          ? String(v)
          : JSON.stringify(v),
    );
  }
  return parts.join(COMPOSITE_ID_SEP);
}

/** Attach a synthetic `id` to composite-key rows; pass other tables through unchanged. */
function withSyntheticId(
  tableKey: string,
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  const fields = getCompositeKeyFields(tableKey);
  if (!fields) return rows;
  return rows.map((r) => {
    const sid = compositeIdString(fields, r);
    return sid ? { ...r, id: sid } : r;
  });
}

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
  rows: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  if (rows.length === 0) return [];
  const delegateName = getDelegateName(tableKey);
  if (!delegateName) return [];
  const delegate = (db as unknown as Record<string, { findMany: (args: unknown) => Promise<unknown[]> }>)[delegateName];
  if (!delegate?.findMany) return [];

  const compositeFields = getCompositeKeyFields(tableKey);
  if (compositeFields) {
    // Fetch existing composite-key rows by an OR of their key combinations,
    // then attach the same synthetic id so they match incoming rows.
    const orConds: Record<string, unknown>[] = [];
    for (const r of rows) {
      const cond: Record<string, unknown> = {};
      let ok = true;
      for (const f of compositeFields) {
        const v = r[f];
        if (v === null || v === undefined) {
          ok = false;
          break;
        }
        cond[f] = v;
      }
      if (ok) orConds.push(cond);
    }
    if (orConds.length === 0) return [];
    const found = await delegate.findMany({ where: { OR: orConds } });
    return withSyntheticId(tableKey, found as Record<string, unknown>[]);
  }

  const ids = rows
    .map((r) => r.id as string)
    .filter((id): id is string => typeof id === "string");
  if (ids.length === 0) return [];
  const found = await delegate.findMany({
    where: { id: { in: ids } },
  });
  return found as Record<string, unknown>[];
}

export function compareTable(
  tableKey: string,
  jsonRowsRaw: Record<string, unknown>[],
  existingRows: Record<string, unknown>[]
): CompareResult {
  // Composite-key tables get a synthetic `id` so the id-keyed logic below works.
  const jsonRows = withSyntheticId(tableKey, jsonRowsRaw);
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
