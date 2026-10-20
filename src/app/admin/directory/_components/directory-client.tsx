"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { RowSelectionState, Table } from "@tanstack/react-table";

import type { DirectoryRow } from "~/server/api/routers/shops";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { DirectoryBulkActions } from "./directory-bulk-actions";
import { createDirectoryColumns } from "./directory-column-structure";
import { DirectoryDetailSheet } from "./directory-detail-sheet";
import { createDirectoryFilters } from "./directory-filters";
import { ExportDirectoryCsv } from "./export-directory-csv";

type Props = { rows: DirectoryRow[] };

export function DirectoryClient({ rows }: Props) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [viewRowId, setViewRowId] = useState<string | null>(null);
  const tableRef = useRef<Table<DirectoryRow> | null>(null);

  const columns = useMemo(
    () => createDirectoryColumns({ onView: (row) => setViewRowId(row.id) }),
    [],
  );
  // Derive from fresh rows so the sheet updates after router.refresh().
  const viewRow = useMemo(
    () => rows.find((r) => r.id === viewRowId) ?? null,
    [rows, viewRowId],
  );
  const filters = useMemo(() => createDirectoryFilters(rows), [rows]);

  const selectedRows = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => rows[parseInt(index, 10)])
      .filter((row): row is DirectoryRow => !!row);
  }, [rowSelection, rows]);

  const handleTableInit = useCallback((table: Table<DirectoryRow>) => {
    tableRef.current = table;
  }, []);

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="contact"
        searchPlaceholder="Search name, shop, email, phone, location..."
        columns={columns}
        data={rows}
        filters={filters}
        defaultColumnVisibility={{ kind: false, state: false, managed: false }}
        mobileHiddenColumnIds={["website", "location", "visibility"]}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        selectionActions={
          <DirectoryBulkActions
            rows={selectedRows}
            onClear={() => setRowSelection({})}
          />
        }
        addButton={
          <ExportDirectoryCsv
            getRows={() =>
              tableRef.current
                ?.getFilteredRowModel()
                .rows.map((r) => r.original) ?? rows
            }
          />
        }
        onTableInit={handleTableInit}
      />
      <DirectoryDetailSheet
        row={viewRow}
        onOpenChange={(open) => {
          if (!open) setViewRowId(null);
        }}
      />
    </div>
  );
}
