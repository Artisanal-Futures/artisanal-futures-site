"use client";

import { useEffect, useRef } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { type CatalogSort } from "../_lib/use-shop-catalog";

type Props = {
  /** "products" or "services": used in labels, e.g. "Search products". */
  noun: string;
  query: string;
  onQueryChange: (query: string) => void;
  sort: CatalogSort;
  onSortChange: (sort: CatalogSort) => void;
  /** Price sorting is pointless when nothing has a price. */
  showPriceSort: boolean;
  category: string;
  onCategoryChange: (category: string) => void;
  categories: { name: string; count: number }[];
  total: number;
};

export function ShopCatalogControls({
  noun,
  query,
  onQueryChange,
  sort,
  onSortChange,
  showPriceSort,
  category,
  onCategoryChange,
  categories,
  total,
}: Props) {
  // Uncontrolled so typing never waits on the URL; only the filter update is
  // debounced (same approach as the listing pages' FilterControls).
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebouncedCallback(
    (value: string) => onQueryChange(value.trim()),
    250,
  );

  // Keep the box in step when the query is changed from elsewhere ("Clear
  // filters"), but never mid-typing: `query` trails the input by the debounce.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (document.activeElement === input) return;
    if (debouncedSearch.isPending()) return;
    if (input.value !== query) input.value = query;
  }, [query, debouncedSearch]);

  const clearSearch = () => {
    debouncedSearch.cancel();
    if (inputRef.current) inputRef.current.value = "";
    onQueryChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <InputGroup className="sm:flex-1">
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            type="search"
            aria-label={`Search ${noun}`}
            placeholder={`Search ${total} ${noun}…`}
            defaultValue={query}
            onChange={(e) => debouncedSearch(e.target.value)}
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="ghost"
                aria-label="Clear search"
                onClick={clearSearch}
              >
                <XIcon className="size-4" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        <Select
          value={sort}
          onValueChange={(value) => onSortChange(value as CatalogSort)}
        >
          <SelectTrigger
            aria-label={`Sort ${noun}`}
            className="w-full sm:w-48 sm:shrink-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            {showPriceSort && (
              <>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
              </>
            )}
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {categories.length >= 2 && (
        <div
          role="group"
          aria-label={`Filter ${noun} by category`}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          <CategoryChip
            selected={!category}
            onClick={() => onCategoryChange("")}
          >
            All
          </CategoryChip>
          {categories.map(({ name, count }) => (
            <CategoryChip
              key={name}
              selected={category === name}
              onClick={() => onCategoryChange(category === name ? "" : name)}
            >
              {name}
              <span
                className={cn(
                  "text-xs tabular-nums",
                  category === name
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {count}
              </span>
            </CategoryChip>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "default" : "outline"}
      aria-pressed={selected}
      onClick={onClick}
      className="rounded-full"
    >
      {children}
    </Button>
  );
}
