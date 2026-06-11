/**
 * Drops columns from an older-schema export that are no longer present in the
 * current Prisma model, so that prisma.<model>.create/update does not throw
 * "Unknown argument" for stale fields.
 *
 * Scalar foreign-key fields (e.g. authorId, subredditId) are intentionally
 * preserved because they have kind "scalar" in the DMMF.
 */

import { Prisma } from "../../../generated/prisma";
import { getDelegateName } from "./config";

/** A scalar FK field on a table and the model it references. */
export type RefField = { field: string; model: string };

// Build lookups once at module load:
//  - DELEGATE_FIELDS: delegate name -> Set of writable (scalar/enum) field names.
//  - REF_FIELDS: delegate name -> scalar FK fields and the model each references
//    (e.g. { field: "authorId", model: "User" }, { field: "shopId", model: "Shop" }),
//    derived from relations.
const DELEGATE_FIELDS = new Map<string, Set<string>>();
const REF_FIELDS = new Map<string, RefField[]>();

for (const model of Prisma.dmmf.datamodel.models) {
  // Prisma model names are PascalCase; delegate names are camelCase (first letter lowered).
  const delegateName =
    model.name.charAt(0).toLowerCase() + model.name.slice(1);
  const fieldNames = new Set<string>();
  const refs: RefField[] = [];
  for (const field of model.fields) {
    if (field.kind === "scalar" || field.kind === "enum") {
      fieldNames.add(field.name);
    }
    // A relation field exposes its scalar FK(s) via relationFromFields; field.type
    // is the referenced model name.
    if (
      field.kind === "object" &&
      Array.isArray(field.relationFromFields) &&
      field.relationFromFields.length > 0
    ) {
      for (const fk of field.relationFromFields) {
        if (typeof fk === "string") refs.push({ field: fk, model: field.type });
      }
    }
  }
  DELEGATE_FIELDS.set(delegateName, fieldNames);
  if (refs.length > 0) REF_FIELDS.set(delegateName, refs);
}

/**
 * Scalar FK fields on a table and the model each references (so a preflight can
 * check whether referenced rows exist, and a remap can reassign them). Returns []
 * for tables with no relations.
 */
export function getRefFields(tableKey: string): RefField[] {
  const delegateName = getDelegateName(tableKey);
  if (!delegateName) return [];
  return REF_FIELDS.get(delegateName) ?? [];
}

/** Just the FK field names on a table (any referenced model), used when applying a remap. */
export function getRefFieldNames(tableKey: string): string[] {
  return getRefFields(tableKey).map((r) => r.field);
}

/**
 * Returns a new object containing only the keys that exist as scalar/enum
 * fields in the current Prisma model for the given table key.
 *
 * If the table key cannot be resolved to a known delegate, the row is returned
 * unchanged (safe fallback – the caller's error handling will surface any
 * remaining unknown-argument errors).
 */
export function filterToKnownFields(
  tableKey: string,
  row: Record<string, unknown>,
): Record<string, unknown> {
  const delegateName = getDelegateName(tableKey);
  if (!delegateName) return row;

  const knownFields = DELEGATE_FIELDS.get(delegateName);
  if (!knownFields) return row;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (knownFields.has(k)) {
      out[k] = v;
    }
  }
  return out;
}
