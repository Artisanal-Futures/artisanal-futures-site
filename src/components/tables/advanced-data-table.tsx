"use client";

import type { LucideIcon } from "lucide-react";
import * as React from "react";

import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
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
import { DataTablePagination } from "./advanced-data-table-pagination";
import { DataTableToolbar } from "./advanced-data-table-toolbar";

export type FilterOption = {
  column: string;
  title: string;
  filters: {
    value: string;
    label: string;
    icon?: LucideIcon;
  }[];
};

export type MassSelectOption = {
  label: string;
  icon?: LucideIcon;
  onClick: (data: unknown) => void;
};

interface DataTableProps<TData, TValue> {
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
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility ?? {});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  
  const lastSelectedRowIndex = React.useRef<number | null>(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: onRowSelectionChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const handleToolbarChange = React.useMemo(() => {
    return table.getSelectedRowModel().rows.length > 0 && !!handleMassDelete;
  }, [table, handleMassDelete]);

  return (
    <div className="w-full space-y-4 transition-all duration-300 ease-in-out">
      <div className={cn("w-full", handleToolbarChange && "hidden")}>
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
      </div>

      <div className={cn("hidden space-x-2", handleToolbarChange && "flex")}>
        <Button size="sm" className="max-h-[32px]">
          Duplicate
        </Button>

        {handleMassDelete && (
          <Button size="sm" className="max-h-[32px]">
            Delete
          </Button>
        )}

        <Button size="sm" className="max-h-[32px]">
          Export
        </Button>
      </div>
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if (e.shiftKey && lastSelectedRowIndex.current !== null) {
                      const start = Math.min(lastSelectedRowIndex.current, row.index);
                      const end = Math.max(lastSelectedRowIndex.current, row.index);
                      
                      const newSelection: RowSelectionState = { ...rowSelection };
                      for (let i = start; i <= end; i++) {
                        newSelection[i] = true;
                      }
                      onRowSelectionChange?.(newSelection);
                    } else {
                      row.toggleSelected();
                    }
                    lastSelectedRowIndex.current = row.index;
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
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
