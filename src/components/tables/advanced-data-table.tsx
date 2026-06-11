"use client";

import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Table as ReactTableInstance,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { DataTableToolbar } from "./advanced-data-table-toolbar";
import { DataTablePagination } from "./advanced-data-table-pagination";
import { useIsMobile } from "~/hooks/use-mobile";

export type FilterOption = {
  column: string;
  title: string;
  filters: {
    value: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
};

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey: string;
  filters?: FilterOption[];
  handleMassDelete?: (data: TData[]) => void;
  handleAdd?: () => void;
  addButtonLabel?: string;
  addButton?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  selectionActions?: React.ReactNode;
  moreOptions?: React.ReactNode;
  searchPlaceholder?: string;
  defaultColumnVisibility?: VisibilityState;
  /** Column ids to hide on mobile (<768px) to keep the table from being too wide. */
  mobileHiddenColumnIds?: string[];
  showViewOptions?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (updater: React.SetStateAction<RowSelectionState>) => void;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onTableInit?: (table: ReactTableInstance<TData>) => void;
}

export function AdvancedDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  filters,
  handleMassDelete: _handleMassDelete,
  handleAdd,
  addButtonLabel = "Add",
  addButton,
  toolbarActions,
  selectionActions,
  moreOptions,
  searchPlaceholder,
  defaultColumnVisibility,
  mobileHiddenColumnIds,
  showViewOptions = false,
  rowSelection = {},
  onRowSelectionChange,
  pagination,
  onPaginationChange,
  onTableInit,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    defaultColumnVisibility ?? {}
  );
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const lastSelectedRowIndex = React.useRef<number | null>(null);

  // On mobile, force the lower-priority columns hidden so the table isn't a
  // very wide horizontal scroll. This is derived (not stored) so user toggles
  // from the View menu are preserved on desktop and simply overridden < 768px.
  const isMobile = useIsMobile();
  const effectiveColumnVisibility = React.useMemo<VisibilityState>(() => {
    if (!isMobile || !mobileHiddenColumnIds?.length) return columnVisibility;
    const merged: VisibilityState = { ...columnVisibility };
    for (const id of mobileHiddenColumnIds) merged[id] = false;
    return merged;
  }, [isMobile, mobileHiddenColumnIds, columnVisibility]);

  // Pagination is controlled only when the parent supplies both the value and
  // a change handler. Otherwise we manage it internally — without this, the
  // controlled state would reset to page 0 every render and "next page" would
  // do nothing (the change handler was a no-op).
  const isPaginationControlled =
    pagination !== undefined && onPaginationChange !== undefined;
  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>(
      pagination ?? { pageIndex: 0, pageSize: 10 },
    );
  const paginationState = isPaginationControlled
    ? pagination
    : internalPagination;
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    if (isPaginationControlled) {
      onPaginationChange(updater);
    } else {
      setInternalPagination(updater);
    }
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: paginationState,
      sorting,
      columnVisibility: effectiveColumnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    autoResetAll: false,
    onRowSelectionChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  React.useEffect(() => {
    onTableInit?.(table);
  }, [table, onTableInit]);

  const hasSelection =
    selectionActions !== undefined && Object.keys(rowSelection).length > 0;

  // When columns declare explicit pixel sizes, give the table a matching
  // min-width so `table-fixed` honours those widths and the surrounding
  // `overflow-x-auto` container can scroll horizontally instead of squishing
  // (and clipping) columns like the row actions. Tables without explicit
  // sizes keep their prior full-width behaviour.
  const visibleLeafColumns = table.getVisibleLeafColumns();
  const hasExplicitSizes = visibleLeafColumns.some(
    (column) => column.columnDef.size !== undefined,
  );
  const tableMinWidth = hasExplicitSizes
    ? visibleLeafColumns.reduce(
        (sum, column) => sum + (column.columnDef.size ?? 150),
        0,
      )
    : undefined;

  return (
    <div className="w-full space-y-4 transition-all duration-300 ease-in-out">
      {hasSelection ? (
        selectionActions
      ) : (
        <DataTableToolbar
          table={table}
          searchKey={searchKey}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          handleAdd={handleAdd}
          addButtonLabel={addButtonLabel}
          addButton={addButton}
          toolbarActions={toolbarActions}
          moreOptions={moreOptions}
          showViewOptions={showViewOptions}
        />
      )}

      <div className="rounded-md border bg-background">
        <Table
          className="table-fixed"
          style={tableMinWidth ? { minWidth: tableMinWidth } : undefined}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => {
                  const size = header.column.columnDef.size;
                  return (
                    <TableHead
                      key={header.id}
                      style={size !== undefined ? { width: size } : undefined}
                      className="overflow-hidden text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {!header.isPlaceholder &&
                        flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer no-user-select"
                  onClick={(e) => {
                    if (e.shiftKey && lastSelectedRowIndex.current !== null) {
                      const start = Math.min(lastSelectedRowIndex.current, row.index);
                      const end = Math.max(lastSelectedRowIndex.current, row.index);

                      const updatedSelection: RowSelectionState = { ...rowSelection };
                      for (let i = start; i <= end; i++) {
                        updatedSelection[i] = true;
                      }
                      onRowSelectionChange?.(updatedSelection);
                    } else {
                      row.toggleSelected();
                    }

                    lastSelectedRowIndex.current = row.index;
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const size = cell.column.columnDef.size;
                    return (
                      <TableCell
                        key={cell.id}
                        style={size !== undefined ? { width: size } : undefined}
                        className="overflow-hidden text-ellipsis"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="border-t">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}