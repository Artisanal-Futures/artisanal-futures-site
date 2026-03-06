/* eslint-disable @typescript-eslint/no-base-to-string */
"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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

  const getTables = api.migration.getForkImportTables.useMutation({
    onSuccess: (data) => {
      setTableListFromServer(data.tables);
    },
    onError: (e) => toast.error(e.message),
  });
  const compareTable = api.migration.compareForkTable.useMutation({
    onSuccess: (data) => {
      if (data && "error" in data) {
        setCompareResult({ error: data.error });
      } else if (data) {
        setCompareResult(data as CompareResultNormal | CompareResultAuth);
      }
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

  const handleApply = useCallback(() => {
    if (!selectedTableKey || !compareResult || "error" in compareResult) return;
    if (compareResult.kind === "auth") {
      applyTable.mutate({
        tableKey: selectedTableKey,
        new: compareResult.new,
        updated: [],
      });
    } else {
      applyTable.mutate({
        tableKey: selectedTableKey,
        new: compareResult.new,
        updated: compareResult.updated.map((u) => u.row),
      });
    }
  }, [selectedTableKey, compareResult, applyTable]);

  const canApply =
    compareResult &&
    !("error" in compareResult) &&
    ((compareResult.kind === "auth" && compareResult.new.length > 0) ||
      (compareResult.kind === "normal" &&
        (compareResult.new.length > 0 || compareResult.updated.length > 0)));

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
            {"error" in compareResult ? null : compareResult.kind === "auth" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>id</TableHead>
                    {compareResult.new[0]
                      ? Object.keys(compareResult.new[0] as object)
                          .filter((k) => k !== "id")
                          .slice(0, 4)
                          .map((k) => <TableHead key={k}>{k}</TableHead>)
                      : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compareResult.new.slice(0, 20).map((row, i) => (
                    <TableRow key={(row.id as string) ?? i}>
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
                {compareResult.new.length > 0 && (
                  <>
                    <h4 className="font-medium">
                      New ({compareResult.new.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>id</TableHead>
                          <TableHead>Preview</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compareResult.new.slice(0, 15).map((row, i) => (
                          <TableRow key={(row.id as string) ?? i}>
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
                    {compareResult.new.length > 15 && (
                      <p className="text-muted-foreground text-xs">
                        … and {compareResult.new.length - 15} more
                      </p>
                    )}
                  </>
                )}
                {compareResult.updated.length > 0 && (
                  <>
                    <h4 className="font-medium">
                      Updated ({compareResult.updated.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>id</TableHead>
                          <TableHead>Preview</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compareResult.updated
                          .slice(0, 10)
                          .map(({ row }, i) => (
                            <TableRow key={(row.id as string) ?? i}>
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
                    {compareResult.updated.length > 10 && (
                      <p className="text-muted-foreground text-xs">
                        … and {compareResult.updated.length - 10} more
                      </p>
                    )}
                  </>
                )}
              </>
            )}

            {canApply && (
              <Button onClick={handleApply} disabled={applyTable.isPending}>
                {applyTable.isPending
                  ? "Applying…"
                  : "Add new/updated for this table"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
