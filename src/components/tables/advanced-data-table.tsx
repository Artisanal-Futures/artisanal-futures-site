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

import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { cn } from "~/lib/utils";
import { DataTableToolbar } from "./advanced-data-table-toolbar";
import { DataTablePagination } from "./advanced-data-table-pagination";

export type FilterOption = {
  column: string;
  title: string;
  filters: {
    value: string;
    label: string;
    icon?: React.ElementType;
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
  moreOptions?: React.ReactNode;
  searchPlaceholder?: string;
  defaultColumnVisibility?: VisibilityState;
  showViewOptions?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (updater: React.SetStateAction<RowSelectionState>) => void;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;

  // Expose internal table instance (used in ProductClient)
  onTableInit?: (table: ReactTableInstance<TData>) => void;
}

export function AdvancedDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  filters,
  handleMassDelete,
  handleAdd,
  addButtonLabel = "Add",
  addButton,
  moreOptions,
  searchPlaceholder,
  defaultColumnVisibility,
  showViewOptions = false,
  rowSelection,
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
  const tableWrapperRef = React.useRef<HTMLDivElement>(null);

  // Default pagination
  const paginationState = pagination ?? {
    pageSize: 10,
    pageIndex: 0,
  };

  // Initialize TanStack Table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: paginationState,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    autoResetAll: false,
    onRowSelectionChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: onPaginationChange ?? (() => {}),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Send table instance to parent via prop
  React.useEffect(() => {
    onTableInit?.(table);
  }, [table, onTableInit]);

  // Deselect when user clicks outside table
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const isInsideTable = tableWrapperRef.current?.contains(target);
      const isInsideDialog = !!target.closest("[role='dialog'], .dialog, .popover-content");

      if (!isInsideTable && !isInsideDialog) {
        if (onRowSelectionChange) onRowSelectionChange({});
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onRowSelectionChange]);

  const renderToolbar = !handleMassDelete || table.getSelectedRowModel().rows.length === 0;

  return (
    <div className="w-full space-y-4 transition-all duration-300 ease-in-out">
      {renderToolbar ? (
        <DataTableToolbar
          table={table}
          searchKey={searchKey}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          handleAdd={handleAdd}
          addButtonLabel={addButtonLabel}
          addButton={addButton}
          moreOptions={moreOptions}
          showViewOptions={showViewOptions}
        />
      ) : (
        <div className="flex space-x-2">
          <Button size="sm" className="max-h-[32px]">Duplicate</Button>
          <Button size="sm" className="max-h-[32px]">Delete</Button>
          <Button size="sm" className="max-h-[32px]">Export</Button>
        </div>
      )}

      <div ref={tableWrapperRef} className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {!header.isPlaceholder &&
                      flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
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
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
