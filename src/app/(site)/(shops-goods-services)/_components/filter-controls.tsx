import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type Category } from "generated/prisma";
import { SearchIcon, XIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const STORE_ATTRIBUTES = [
  "African American Culture",
  "African Culture",
  "African American Civil Rights",
  "Black Owned",
  "Woman Owned",
  "Worker Owned",
  "Community Education",
  "Food Sovereignty",
];

export const FilterControls = ({
  updateSearchParams,
  resetFilters,
  subcategories,
  stores,
}: {
  updateSearchParams: (params: Record<string, string | number | null>) => void;
  resetFilters: () => void;
  subcategories?: Category[];
  stores: { id: string; name: string }[] | undefined;
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchTerm = searchParams.get("search") ?? "";
  const selectedStore = searchParams.get("store") ?? "all";
  // Relevance is only meaningful (and only offered) while a query is active.
  const sortParam = searchParams.get("sort");
  const sortOrder =
    sortParam === "asc" || sortParam === "desc"
      ? sortParam
      : searchTerm
        ? "relevance"
        : "asc";
  const selectedAttributes = useMemo(
    () => searchParams.get("attributes")?.split(",").filter(Boolean) ?? [],
    [searchParams],
  );
  const selectedSubcategorySlug = searchParams.get("subcategory");

  const handleAttributeChange = (checked: boolean, attribute: string) => {
    const newAttributes = checked
      ? [...selectedAttributes, attribute]
      : selectedAttributes.filter((attr) => attr !== attribute);
    updateSearchParams({
      attributes: newAttributes.length > 0 ? newAttributes.join(",") : null,
    });
  };

  // The input stays uncontrolled so typing is never blocked on a server round
  // trip; only the URL update is debounced. Previously every keystroke pushed
  // a new route, re-running the RSC page and a Prisma query each time.
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebouncedCallback(
    (value: string) => updateSearchParams({ search: value.trim() || null }),
    300,
  );

  // Keep the box in step when the term is changed from elsewhere (a filter
  // chip, or "Reset all").
  //
  // Never do this while the user is typing: `searchTerm` trails the input by
  // the debounce interval, so syncing mid-edit would rewrite the box to a
  // stale value and swallow whatever was typed after the last flush.
  useEffect(() => {
    const input = searchInputRef.current;
    if (!input) return;
    if (document.activeElement === input) return;
    if (debouncedSearch.isPending()) return;
    if (input.value !== searchTerm) input.value = searchTerm;
  }, [searchTerm, debouncedSearch]);

  const clearSearch = () => {
    debouncedSearch.cancel();
    if (searchInputRef.current) searchInputRef.current.value = "";
    updateSearchParams({ search: null });
  };

  return (
    <div className="flex flex-col space-y-6">
      {subcategories && subcategories.length > 0 && (
        <div className="space-y-4 border-b pb-6">
          <h3 className="font-medium text-slate-900">Subcategories</h3>
          <ul className="space-y-2">
            {subcategories.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={`${pathname}?subcategory=${encodeURIComponent(
                    sub.name,
                  )}`}
                  scroll={false}
                  className={`block rounded-md p-2 text-sm ${
                    selectedSubcategorySlug === encodeURIComponent(sub.name)
                      ? "bg-accent font-bold"
                      : "hover:bg-accent/50"
                  }`}
                >
                  {sub.name}
                </Link>
              </li>
            ))}
            {selectedSubcategorySlug && (
              <Link
                href={pathname}
                scroll={false}
                className="text-muted-foreground mt-2 block text-sm hover:underline"
              >
                Clear filter
              </Link>
            )}
          </ul>
        </div>
      )}

      <div className="space-y-4 pt-6">
        <h3 className="font-medium text-slate-900">Search</h3>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchInputRef}
            type="search"
            aria-label="Search by name, tag, or shop"
            placeholder="Search by name, tag, or shop…"
            defaultValue={searchTerm}
            onChange={(e) => debouncedSearch(e.target.value)}
          />
          {searchTerm && (
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
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Store</h3>
        <Select
          value={selectedStore}
          onValueChange={(value) => updateSearchParams({ store: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by store" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {stores?.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Sort</h3>
        <Select
          value={sortOrder}
          onValueChange={(value) => updateSearchParams({ sort: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort by name" />
          </SelectTrigger>
          <SelectContent>
            {searchTerm && <SelectItem value="relevance">Relevance</SelectItem>}
            <SelectItem value="asc">Name (A-Z)</SelectItem>
            <SelectItem value="desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {/* "any": selecting more attributes widens the results. */}
          <h3 className="font-medium text-slate-900">Store Attributes (any)</h3>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset all
          </Button>
        </div>
        <div className="space-y-3">
          {STORE_ATTRIBUTES.map((attribute) => (
            <div key={attribute} className="flex items-center space-x-2">
              <Checkbox
                id={attribute}
                checked={selectedAttributes.includes(attribute)}
                onCheckedChange={(checked) =>
                  handleAttributeChange(!!checked, attribute)
                }
              />
              <Label htmlFor={attribute} className="text-sm text-slate-600">
                {attribute}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
