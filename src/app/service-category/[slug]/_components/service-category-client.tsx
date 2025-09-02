"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { type Category } from "@prisma/client";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { NewServiceCard } from "~/app/(site)/services/_components/new-service-card";
import { type ServiceWithShop } from "~/types/service";

const STORE_ATTRIBUTES = [
  "African American Culture",
  "African Culture",
  "African American Civil Rights",
  "Black Owned",
  "Woman Owned",
  "Community Education",
  "Food Sovereignty",
];

// --- Pagination Helpers (same as products) ---

const DOTS = "...";

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

const usePagination = ({
  totalCount,
  pageSize,
  siblingCount = 1,
  currentPage,
}: {
  totalCount: number;
  pageSize: number;
  siblingCount?: number;
  currentPage: number;
}) => {
  const paginationRange = useMemo(() => {
    const totalPageCount = Math.ceil(totalCount / pageSize);
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPageCount) {
      return range(1, totalPageCount);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPageCount
    );

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, totalPageCount];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(
        totalPageCount - rightItemCount + 1,
        totalPageCount
      );
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }

    return [];
  }, [totalCount, pageSize, siblingCount, currentPage]);

  return paginationRange;
};

function Pagination({
  onPageChange,
  totalCount,
  siblingCount = 1,
  currentPage,
  pageSize,
}: {
  onPageChange: (page: number) => void;
  totalCount: number;
  siblingCount?: number;
  currentPage: number;
  pageSize: number;
}) {
  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize,
  });
  
  const totalPageCount = Math.ceil(totalCount / pageSize);

  if (currentPage === 0 || totalPageCount < 2) {
    return null;
  }

  const onNext = () => {
    onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    onPageChange(currentPage - 1);
  };

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <Button onClick={onPrevious} disabled={currentPage <= 1} size="sm">
        Previous
      </Button>
      <div className="flex items-center gap-1">
        {paginationRange?.map((pageNumber, index) => {
          if (pageNumber === DOTS) {
            return (
              <span key={`${DOTS}-${index}`} className="px-2 py-1 text-sm">
                &#8230;
              </span>
            );
          }

          return (
            <Button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber as number)}
              variant={pageNumber === currentPage ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
            >
              {pageNumber}
            </Button>
          );
        })}
      </div>
      <Button onClick={onNext} disabled={currentPage >= totalPageCount} size="sm">
        Next
      </Button>
    </div>
  );
}

const FilterControls = memo(function FilterControls({
  updateSearchParams,
  resetFilters,
  subcategories,
  stores,
}: {
  updateSearchParams: (params: Record<string, string | number | null>) => void;
  resetFilters: () => void;
  subcategories?: Category[];
  stores: { id: string; name: string }[] | undefined;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const searchTerm = searchParams.get("search") ?? "";
  const selectedStore = searchParams.get("store") ?? "all";
  const sortOrder = (searchParams.get("sort") as "asc" | "desc") ?? "asc";
  const selectedAttributes = useMemo(() => searchParams.get("attributes")?.split(",").filter(Boolean) ?? [], [searchParams]);
  const selectedSubcategorySlug = searchParams.get("subcategory");

  const handleAttributeChange = (checked: boolean, attribute: string) => {
    const newAttributes = checked
      ? [...selectedAttributes, attribute]
      : selectedAttributes.filter((attr) => attr !== attribute);
    updateSearchParams({ attributes: newAttributes.length > 0 ? newAttributes.join(',') : null });
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
                  href={`${pathname}?subcategory=${encodeURIComponent(sub.name)}`}
                  scroll={false}
                  className={`block rounded-md p-2 text-sm ${selectedSubcategorySlug === encodeURIComponent(sub.name) ? 'bg-accent font-bold' : 'hover:bg-accent/50'}`}
                >
                  {sub.name}
                </Link>
              </li>
            ))}
            {selectedSubcategorySlug && (
              <Link href={pathname} scroll={false} className="mt-2 block text-sm text-muted-foreground hover:underline">
                Clear filter
              </Link>
            )}
          </ul>
        </div>
      )}
      
      <div className="space-y-4 pt-6">
        <h3 className="font-medium text-slate-900">Search</h3>
        <Input placeholder="Search services..." defaultValue={searchTerm} onChange={(e) => updateSearchParams({ search: e.target.value })} />
      </div>
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Store</h3>
        <Select value={selectedStore} onValueChange={(value) => updateSearchParams({ store: value })}>
          <SelectTrigger><SelectValue placeholder="Filter by store" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {stores?.map((store) => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Sort</h3>
        <Select value={sortOrder} onValueChange={(value) => updateSearchParams({ sort: value })}>
          <SelectTrigger><SelectValue placeholder="Sort by name" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Name (A-Z)</SelectItem>
            <SelectItem value="desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-900">Store Attributes</h3>
          <Button variant="ghost" size="sm" onClick={resetFilters}>Reset all</Button>
        </div>
        <div className="space-y-3">
          {STORE_ATTRIBUTES.map((attribute) => (
            <div key={attribute} className="flex items-center space-x-2">
              <Checkbox
                id={attribute}
                checked={selectedAttributes.includes(attribute)}
                onCheckedChange={(checked) => handleAttributeChange(!!checked, attribute)}
              />
              <Label htmlFor={attribute} className="text-sm text-slate-600">{attribute}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
FilterControls.displayName = "FilterControls";

export function ServiceCategoryClient({ 
  initialServices, 
  subcategories,
  totalCount,
  totalPages,
}: { 
  initialServices: ServiceWithShop[]; 
  subcategories?: Category[];
  totalCount: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [useFlexLayout, setUseFlexLayout] = useState(false);

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const itemsPerPage = parseInt(searchParams.get("limit") ?? "20", 10);
  const currentPage = Math.max(1, Math.min(totalPages, rawPage));

  const updateSearchParams = useCallback((newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '' || (key === 'store' && value === 'all')) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    const isFilterChange = Object.keys(newParams).some(key => key !== 'page' && key !== 'limit');
    if (isFilterChange) {
        params.delete('page');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const { data: stores } = api.shop.getAllValid.useQuery();
  const resetFilters = useCallback(() => router.push(pathname, { scroll: false }), [router, pathname]);

  return (
    <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-start">
      <aside className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:w-72 md:shrink-0 md:sticky md:top-4 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto">
        <FilterControls
          updateSearchParams={updateSearchParams}
          resetFilters={resetFilters}
          subcategories={subcategories}
          stores={stores}
        />
        {/* <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseFlexLayout((val) => !val)}
          >
            Switch to {useFlexLayout ? "Grid" : "Flex"} Layout
          </Button>
        </div> */}
      </aside>
      <main className="flex-1 space-y-6 px-4 md:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
            {(currentPage - 1) * itemsPerPage + initialServices.length} of{" "}
            {totalCount} services
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm font-medium">Items per page:</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => updateSearchParams({ limit: Number(e.target.value) })}
              className="h-8 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {useFlexLayout ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {initialServices.map((service) => (
              <div key={service.id} style={{ flex: "1 1 30%" }}>
                <NewServiceCard service={service} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gridAutoRows: "min-content" }}
          >
            {initialServices.map((service) => (
              <NewServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {initialServices.length === 0 && (
          <p className="text-center text-muted-foreground">No services found for the selected filters.</p>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={itemsPerPage}
            onPageChange={(page) => updateSearchParams({ page })}
          />
        )}
      </main>
    </div>
  );
}