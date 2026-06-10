"use client";

import * as React from "react";
import { CheckIcon, SlidersHorizontalIcon } from "lucide-react";
import type { Table } from "@tanstack/react-table";

import type { FilterOption } from "./advanced-data-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

interface DataTableFiltersProps<TData> {
  table: Table<TData>;
  filters?: FilterOption[];
}

export function DataTableFilters<TData>({
  table,
  filters,
}: DataTableFiltersProps<TData>) {
  if (!filters?.length) return null;

  // Count how many filter columns currently have a value set
  const activeFilterCount = filters.filter((f) => {
    const col = table.getColumn(f.column);
    return col?.getFilterValue() !== undefined;
  }).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <SlidersHorizontalIcon className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 rounded-sm px-1 font-normal"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandList>
            {filters.map((filterOption, groupIdx) => {
              const column = table.getColumn(filterOption.column);
              if (!column) return null;

              const facets = column.getFacetedUniqueValues();
              const selectedValues = new Set(
                column.getFilterValue() as string[] | undefined,
              );

              return (
                <React.Fragment key={groupIdx}>
                  {groupIdx > 0 && <CommandSeparator />}
                  <CommandGroup heading={filterOption.title}>
                    {filterOption.filters.map((option) => {
                      const isSelected = selectedValues.has(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => {
                            if (isSelected) {
                              selectedValues.delete(option.value);
                            } else {
                              selectedValues.add(option.value);
                            }
                            const filterValues = Array.from(selectedValues);
                            column.setFilterValue(
                              filterValues.length ? filterValues : undefined,
                            );
                          }}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible",
                            )}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </div>
                          {option.icon && (
                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{option.label}</span>
                          {facets?.get(option.value) !== undefined && (
                            <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                              {facets.get(option.value)}
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </React.Fragment>
              );
            })}

            {activeFilterCount > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => table.resetColumnFilters()}
                    className="justify-center text-center"
                  >
                    Clear all filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
