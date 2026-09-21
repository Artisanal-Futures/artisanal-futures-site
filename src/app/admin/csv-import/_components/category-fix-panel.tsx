"use client";

import { useMemo, useRef } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";

import type {
  ImportType,
  ProductCsvRow,
  ServiceCsvRow,
} from "~/lib/csv-import";
import type {
  AnalyzedRow,
  CategoryRemaps,
} from "~/server/api/shared/csv-import";
import type { RouterOutputs } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

/** Sentinel option value: drop this category name from every row that uses it. */
const SKIP_VALUE = "__skip__";

type Props = {
  rows: AnalyzedRow<ProductCsvRow | ServiceCsvRow>[];
  type: ImportType;
  categories: RouterOutputs["category"]["getAll"];
  remaps: CategoryRemaps;
  onRemap: (key: string, value: string | null) => void;
  disabled?: boolean;
};

const normalizeName = (value: string): string => value.trim().toLowerCase();

/**
 * One row per unknown category name in the file, with a picker so the admin
 * can point it at a real category (or skip it) without editing the CSV.
 * Keys are normalized so "Ceramic" and "ceramic " collapse into one choice.
 */
export function CategoryFixPanel({
  rows,
  type,
  categories,
  remaps,
  onRemap,
  disabled,
}: Props) {
  // A name that has been mapped resolves on the next analysis and so stops
  // appearing in `unknownCategories`; remember its spelling so the entry stays
  // in the list and the admin can still change their mind.
  const labelCache = useRef(new Map<string, string>());

  const unknown = useMemo(() => {
    const byKey = new Map<string, { label: string; rowCount: number }>();
    for (const row of rows) {
      for (const name of row.unknownCategories) {
        const key = normalizeName(name);
        labelCache.current.set(key, name);
        const entry = byKey.get(key);
        if (entry) {
          entry.rowCount += 1;
        } else {
          byKey.set(key, { label: name, rowCount: 1 });
        }
      }
    }
    for (const key of Object.keys(remaps)) {
      if (!byKey.has(key)) {
        byKey.set(key, {
          label: labelCache.current.get(key) ?? key,
          rowCount: 0,
        });
      }
    }
    return [...byKey.entries()].map(([key, entry]) => ({ key, ...entry }));
  }, [rows, remaps]);

  const options = useMemo(() => {
    const categoryType = type === "products" ? "PRODUCT" : "SERVICE";
    return categories
      .filter((category) => category.type === categoryType)
      .map((category) => ({
        id: category.id,
        label: category.parent
          ? `${category.name} (${category.parent.name})`
          : category.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories, type]);

  if (unknown.length === 0) return null;

  const kind = type === "products" ? "product" : "service";
  const pending = unknown.filter((entry) => entry.rowCount > 0).length;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-800 dark:text-amber-300" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {pending === 0
              ? "All unknown categories resolved"
              : `${pending} unknown ${pending === 1 ? "category" : "categories"}`}
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            These names don&apos;t match any existing {kind} category. Choose a
            replacement for each, or skip it, and the rows will be re-checked.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {unknown.map((entry) => {
          const current = remaps[entry.key];
          const selectValue = current === null ? SKIP_VALUE : (current ?? "");

          return (
            <li
              key={entry.key}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
            >
              <div className="flex min-w-0 items-center gap-2 sm:w-64">
                <code className="bg-background truncate rounded px-1.5 py-0.5 text-xs">
                  {entry.label}
                </code>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {entry.rowCount > 0
                    ? `${entry.rowCount} ${entry.rowCount === 1 ? "row" : "rows"}`
                    : current === null
                      ? "skipped"
                      : "mapped"}
                </Badge>
              </div>
              <ArrowRight className="text-muted-foreground hidden size-4 shrink-0 sm:block" />
              <Select
                value={selectValue}
                disabled={disabled}
                onValueChange={(value) =>
                  onRemap(entry.key, value === SKIP_VALUE ? null : value)
                }
              >
                <SelectTrigger
                  className="w-full sm:w-72"
                  aria-label={`Replacement for ${entry.label}`}
                >
                  <SelectValue placeholder="Choose a category…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SKIP_VALUE}>Skip this category</SelectItem>
                  {options.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
