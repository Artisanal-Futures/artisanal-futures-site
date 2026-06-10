/* eslint-disable @typescript-eslint/no-base-to-string */
"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type CompareResultNormal = {
  kind: "normal";
  new: Record<string, unknown>[];
  updated: {
    row: Record<string, unknown>;
    previous: Record<string, unknown>;
  }[];
  unchangedCount: number;
};

type CompareResultAuth = {
  kind: "auth";
  new: Record<string, unknown>[];
  existingIds: string[];
};

type CompareResult =
  | CompareResultNormal
  | CompareResultAuth
  | { error: string };

type RefGroup = {
  model: string;
  fields: string[];
  missing: { id: string; count: number }[];
  candidates: { id: string; label: string }[];
};

type RefPreflight = { groups: RefGroup[] };

const UNMAPPED = "__unmapped__";
const ALL_STORES = "__all__";

/** All row ids that can be selected for import in a compare result. */
function selectableIds(
  result: CompareResultNormal | CompareResultAuth,
): string[] {
  if (result.kind === "auth") {
    return result.new.map((r) => r.id as string).filter(Boolean);
  }
  return [
    ...result.new.map((r) => r.id as string),
    ...result.updated.map((u) => u.row.id as string),
  ].filter(Boolean);
}

export function ForkImportClient() {
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<Record<
    string,
    unknown[]
  > | null>(null);
  const [tableListFromServer, setTableListFromServer] = useState<
    { key: string; count: number }[]
  >([]);
  const [selectedTableKey, setSelectedTableKey] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(
    null,
  );
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  // Ids checked for import. Defaults to every row on each compare, so the
  // out-of-the-box behaviour (import everything) is unchanged.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Foreign-key preflight: referenced rows (users, shops, …) not in the DB yet.
  const [preflight, setPreflight] = useState<RefPreflight | null>(null);
  // Chosen reassignments: missing referenced id -> existing id.
  const [idRemap, setIdRemap] = useState<Record<string, string>>({});
  // Product/Service only: limit displayed/imported rows to one store (shopId).
  const [storeFilter, setStoreFilter] = useState<string>(ALL_STORES);

  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setManySelected = useCallback((ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const getTables = api.migration.getForkImportTables.useMutation({
    onSuccess: (data) => {
      setTableListFromServer(data.tables);
    },
    onError: (e) => toast.error(e.message),
  });
  const compareTable = api.migration.compareForkTable.useMutation({
    onSuccess: (data) => {
      if (!data) return;
      setIdRemap({});
      setStoreFilter(ALL_STORES);
      if ("error" in data && typeof data.error === "string") {
        setCompareResult({ error: data.error });
        setSelectedIds(new Set());
        setPreflight(null);
        return;
      }
      const full = data as (CompareResultNormal | CompareResultAuth) & {
        refPreflight?: RefPreflight;
      };
      setCompareResult(full);
      setSelectedIds(new Set(selectableIds(full)));
      setPreflight(full.refPreflight ?? null);
    },
    onError: (e) => toast.error(e.message),
  });
  const applyTable = api.migration.applyForkTable.useMutation({
    onSuccess: (result) => {
      const { created, updated, errors } = result;
      if (errors.length > 0) {
        toast.error(
          `Applied: ${created} created, ${updated} updated. Errors: ${errors.length}`,
        );
        errors.slice(0, 5).forEach((e) => toast.error(`${e.id}: ${e.message}`));
      } else {
        toast.success(`Applied: ${created} created, ${updated} updated.`);
      }
      setCompareResult(null);
      if (selectedTableKey && parsedData?.[selectedTableKey]) {
        compareTable.mutate({
          tableKey: selectedTableKey,
          rows: parsedData[selectedTableKey] as Record<string, unknown>[],
        });
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileLoad = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setIsLoadingFile(true);
      setLoadedFileName(null);
      setParsedData(null);
      setTableListFromServer([]);
      setCompareResult(null);
      setSelectedTableKey(null);
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const raw = String(reader.result);
          const data = JSON.parse(raw) as Record<string, unknown>;
          const out: Record<string, unknown[]> = {};
          for (const [key, val] of Object.entries(data)) {
            if (Array.isArray(val)) out[key] = val;
          }
          setParsedData(out);
          setLoadedFileName(f.name);
          getTables.mutate(
            { json: raw },
            {
              onSuccess: () => {
                toast.success(
                  `Loaded ${f.name} (${Object.keys(out).length} tables).`,
                );
              },
              onSettled: () => setIsLoadingFile(false),
            },
          );
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Invalid JSON");
          setIsLoadingFile(false);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsLoadingFile(false);
      };
      reader.readAsText(f);
      e.target.value = "";
    },
    [getTables],
  );

  const tableOptions =
    tableListFromServer.length > 0
      ? tableListFromServer
      : parsedData
        ? Object.entries(parsedData).map(([key, arr]) => ({
            key,
            count: arr.length,
          }))
        : [];

  // Product/Service get a "filter by store" control that scopes the displayed,
  // selectable, and imported rows to one shopId.
  const isStoreTable =
    selectedTableKey === "Product" || selectedTableKey === "Service";

  const shopNameById = useMemo(() => {
    const map = new Map<string, string>();
    const shops = parsedData?.Shop;
    if (Array.isArray(shops)) {
      for (const s of shops as Record<string, unknown>[]) {
        if (typeof s.id === "string") {
          map.set(s.id, typeof s.name === "string" ? s.name : s.id);
        }
      }
    }
    return map;
  }, [parsedData]);

  const storeOptions = useMemo(() => {
    if (!isStoreTable || !compareResult || "error" in compareResult) return [];
    const rows =
      compareResult.kind === "auth"
        ? compareResult.new
        : [...compareResult.new, ...compareResult.updated.map((u) => u.row)];
    const counts = new Map<string, number>();
    for (const r of rows) {
      const sid = typeof r.shopId === "string" ? r.shopId : "(none)";
      counts.set(sid, (counts.get(sid) ?? 0) + 1);
    }
    return [...counts.entries()].map(([id, count]) => ({
      id,
      count,
      label: id === "(none)" ? "(no store)" : (shopNameById.get(id) ?? id),
    }));
  }, [isStoreTable, compareResult, shopNameById]);

  const rowVisible = useCallback(
    (row: Record<string, unknown>) => {
      if (!isStoreTable || storeFilter === ALL_STORES) return true;
      const sid = typeof row.shopId === "string" ? row.shopId : "(none)";
      return sid === storeFilter;
    },
    [isStoreTable, storeFilter],
  );

  const handleCompare = useCallback(() => {
    if (!selectedTableKey || !parsedData?.[selectedTableKey]) {
      toast.error("Select a table first.");
      return;
    }
    setCompareResult(null);
    compareTable.mutate({
      tableKey: selectedTableKey,
      rows: parsedData[selectedTableKey] as Record<string, unknown>[],
    });
  }, [selectedTableKey, parsedData, compareTable]);

  // Rows that will actually be imported: selected AND visible under the store filter.
  const keepRow = useCallback(
    (r: Record<string, unknown>) =>
      selectedIds.has(r.id as string) && rowVisible(r),
    [selectedIds, rowVisible],
  );

  const effectiveCount = useMemo(() => {
    if (!compareResult || "error" in compareResult) return 0;
    const rows =
      compareResult.kind === "auth"
        ? compareResult.new
        : [...compareResult.new, ...compareResult.updated.map((u) => u.row)];
    return rows.filter(keepRow).length;
  }, [compareResult, keepRow]);

  // Rows shown under the current store filter (normal tables only).
  const visibleNew = useMemo(() => {
    if (!compareResult || "error" in compareResult) return [];
    if (compareResult.kind !== "normal") return [];
    return compareResult.new.filter(rowVisible);
  }, [compareResult, rowVisible]);

  const visibleUpdated = useMemo(() => {
    if (!compareResult || "error" in compareResult) return [];
    if (compareResult.kind !== "normal") return [];
    return compareResult.updated.filter((u) => rowVisible(u.row));
  }, [compareResult, rowVisible]);

  const handleApply = useCallback(() => {
    if (!selectedTableKey || !compareResult || "error" in compareResult) return;
    const remap = Object.keys(idRemap).length > 0 ? idRemap : undefined;
    if (compareResult.kind === "auth") {
      applyTable.mutate({
        tableKey: selectedTableKey,
        new: compareResult.new.filter(keepRow),
        updated: [],
        idRemap: remap,
      });
    } else {
      applyTable.mutate({
        tableKey: selectedTableKey,
        new: compareResult.new.filter(keepRow),
        updated: compareResult.updated.map((u) => u.row).filter(keepRow),
        idRemap: remap,
      });
    }
  }, [selectedTableKey, compareResult, applyTable, idRemap, keepRow]);

  const canApply =
    !!compareResult && !("error" in compareResult) && effectiveCount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fork import</h1>
        <p className="text-muted-foreground text-sm">
          Load a JSON export from the fork, then compare and import table by
          table.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Load export file</CardTitle>
          <p className="text-muted-foreground text-sm">
            Choose a JSON database export file. Contents are not displayed (file
            can be large).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".json"
            className="hidden"
            id="fork-import-file"
            aria-label="Load JSON export file"
            onChange={handleFileLoad}
          />
          <Button
            onClick={() => document.getElementById("fork-import-file")?.click()}
            disabled={isLoadingFile}
          >
            {isLoadingFile ? "Loading…" : "Load file"}
          </Button>
          {loadedFileName && (
            <p className="text-muted-foreground text-sm">
              Loaded: <span className="font-medium">{loadedFileName}</span>
              {tableListFromServer.length > 0 &&
                ` (${tableListFromServer.length} tables)`}
            </p>
          )}
        </CardContent>
      </Card>

      {tableOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>2. Select table</CardTitle>
            <p className="text-muted-foreground text-sm">
              Choose a table to compare and optionally import.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select
                value={selectedTableKey ?? ""}
                onValueChange={(v) => {
                  setSelectedTableKey(v || null);
                  setCompareResult(null);
                  setPreflight(null);
                  setIdRemap({});
                  setStoreFilter(ALL_STORES);
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tableOptions.map(({ key, count }) => (
                    <SelectItem key={key} value={key}>
                      {key} ({count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleCompare}
                disabled={!selectedTableKey || compareTable.isPending}
                variant="secondary"
              >
                {compareTable.isPending ? "Comparing…" : "Compare to DB"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {compareResult && (
        <Card>
          <CardHeader>
            <CardTitle>3. Compare result</CardTitle>
            {"error" in compareResult ? (
              <p className="text-destructive text-sm">{compareResult.error}</p>
            ) : compareResult.kind === "auth" ? (
              <p className="text-muted-foreground text-sm">
                New by id: {compareResult.new.length}. Already in DB:{" "}
                {compareResult.existingIds.length}.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                New: {compareResult.new.length}. Updated:{" "}
                {compareResult.updated.length}. Unchanged:{" "}
                {compareResult.unchangedCount}.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {preflight?.groups.map((group) => (
              <div
                key={group.model}
                className="space-y-3 rounded-md border border-amber-300 bg-amber-50 p-4"
              >
                <div>
                  <h4 className="font-medium text-amber-900">
                    Missing {group.model.toLowerCase()} references (
                    {group.missing.length})
                  </h4>
                  <p className="text-xs text-amber-800">
                    Some rows reference {group.model.toLowerCase()}s not in this
                    database (field{group.fields.length === 1 ? "" : "s"}:{" "}
                    {group.fields.join(", ")}). Reassign each to an existing{" "}
                    {group.model.toLowerCase()}, or leave unmapped to skip those
                    rows (they will error on import).{" "}
                    {
                      group.missing.filter((m) => idRemap[m.id]).length
                    } of {group.missing.length} reassigned.
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Missing {group.model.toLowerCase()} id</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Reassign to</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.missing.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs">
                          {m.id}
                        </TableCell>
                        <TableCell className="text-xs">{m.count}</TableCell>
                        <TableCell>
                          <Select
                            value={idRemap[m.id] ?? ""}
                            onValueChange={(v) =>
                              setIdRemap((prev) => {
                                const next = { ...prev };
                                if (v && v !== UNMAPPED) next[m.id] = v;
                                else delete next[m.id];
                                return next;
                              })
                            }
                          >
                            <SelectTrigger className="w-[280px]">
                              <SelectValue placeholder="— leave unmapped —" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={UNMAPPED}>
                                — leave unmapped —
                              </SelectItem>
                              {group.candidates.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
            {isStoreTable && storeOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Filter by store:</span>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STORES}>All stores</SelectItem>
                    {storeOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label} ({s.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {"error" in compareResult ? null : compareResult.kind === "auth" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={
                          compareResult.new.length > 0 &&
                          compareResult.new.every((r) =>
                            selectedIds.has(r.id as string),
                          )
                        }
                        onCheckedChange={(c) =>
                          setManySelected(
                            compareResult.new.map((r) => r.id as string),
                            c === true,
                          )
                        }
                        aria-label="Select all rows"
                      />
                    </TableHead>
                    <TableHead>id</TableHead>
                    {["name", "email", "userId", "provider"].map((k) => (
                      <TableHead key={k}>{k}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compareResult.new.map((row, i) => (
                    <TableRow key={(row.id as string) ?? i}>
                      <TableCell className="w-8">
                        <Checkbox
                          checked={selectedIds.has(row.id as string)}
                          onCheckedChange={() => toggleId(row.id as string)}
                          aria-label={`Select ${String(row.id)}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {String(row.id)}
                      </TableCell>
                      {["name", "email", "userId", "provider"].map((k) => (
                        <TableCell
                          key={k}
                          className="max-w-[200px] truncate text-xs"
                        >
                          {row[k] != null ? String(row[k]) : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <>
                {visibleNew.length > 0 && (
                  <>
                    <h4 className="font-medium">New ({visibleNew.length})</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">
                            <Checkbox
                              checked={visibleNew.every((r) =>
                                selectedIds.has(r.id as string),
                              )}
                              onCheckedChange={(c) =>
                                setManySelected(
                                  visibleNew.map((r) => r.id as string),
                                  c === true,
                                )
                              }
                              aria-label="Select all new rows"
                            />
                          </TableHead>
                          <TableHead>id</TableHead>
                          <TableHead>Preview</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleNew.map((row, i) => (
                          <TableRow key={(row.id as string) ?? i}>
                            <TableCell className="w-8">
                              <Checkbox
                                checked={selectedIds.has(row.id as string)}
                                onCheckedChange={() =>
                                  toggleId(row.id as string)
                                }
                                aria-label={`Select ${String(row.id)}`}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {String(row.id)}
                            </TableCell>
                            <TableCell className="max-w-[300px] truncate text-xs">
                              {JSON.stringify(
                                Object.fromEntries(
                                  Object.entries(row)
                                    .filter(([k]) => k !== "id")
                                    .slice(0, 3),
                                ),
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
                {visibleUpdated.length > 0 && (
                  <>
                    <h4 className="font-medium">
                      Updated ({visibleUpdated.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">
                            <Checkbox
                              checked={visibleUpdated.every((u) =>
                                selectedIds.has(u.row.id as string),
                              )}
                              onCheckedChange={(c) =>
                                setManySelected(
                                  visibleUpdated.map((u) => u.row.id as string),
                                  c === true,
                                )
                              }
                              aria-label="Select all updated rows"
                            />
                          </TableHead>
                          <TableHead>id</TableHead>
                          <TableHead>Preview</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleUpdated.map(({ row }, i) => (
                          <TableRow key={(row.id as string) ?? i}>
                            <TableCell className="w-8">
                              <Checkbox
                                checked={selectedIds.has(row.id as string)}
                                onCheckedChange={() =>
                                  toggleId(row.id as string)
                                }
                                aria-label={`Select ${String(row.id)}`}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {String(row.id)}
                            </TableCell>
                            <TableCell className="max-w-[300px] truncate text-xs">
                              {JSON.stringify(
                                Object.fromEntries(
                                  Object.entries(row)
                                    .filter(([k]) => k !== "id")
                                    .slice(0, 3),
                                ),
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </>
            )}

            {canApply && (
              <Button onClick={handleApply} disabled={applyTable.isPending}>
                {applyTable.isPending
                  ? "Applying…"
                  : `Import ${effectiveCount} selected row${
                      effectiveCount === 1 ? "" : "s"
                    }`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
