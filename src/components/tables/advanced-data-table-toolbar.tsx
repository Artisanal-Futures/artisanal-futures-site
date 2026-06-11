"use client";

import * as React from "react";
import { PlusCircleIcon, SearchIcon, XCircleIcon } from "lucide-react";
import type { Table } from "@tanstack/react-table";
import type { FilterOption } from "./advanced-data-table";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { DataTableFilters } from "./advanced-data-table-filters";
import { DataTableViewOptions } from "./advanced-data-table-view-options";

type Props<TData> = {
  table: Table<TData>;
  filters?: FilterOption[];
  searchKey: string;
  searchPlaceholder?: string;
  handleAdd?: () => void;
  addButtonLabel?: string;
  addButton?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  moreOptions?: React.ReactNode;
  showViewOptions?: boolean;
};

export function DataTableToolbar<TData>({
  table,
  filters,
  searchKey,
  searchPlaceholder,
  handleAdd,
  addButtonLabel = "Add",
  addButton,
  toolbarActions,
  moreOptions,
  showViewOptions = true,
}: Props<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      {/* LEFT group: search + filters + reset */}
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <div className="relative w-full sm:w-auto">
          <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder ?? `Filter by ${searchKey}...`}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-full bg-background pl-8 sm:w-72"
          />
        </div>

        {filters && filters.length > 0 && (
          <DataTableFilters table={table} filters={filters} />
        )}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <XCircleIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* RIGHT group: moreOptions, view options, actions, add button */}
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        {!!moreOptions && moreOptions}
        {showViewOptions && <DataTableViewOptions table={table} />}
        {!!toolbarActions && toolbarActions}

        {handleAdd && (
          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs"
            onClick={handleAdd}
          >
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            {addButtonLabel}
          </Button>
        )}

        {!!addButton && addButton}
      </div>
    </div>
  );
}
