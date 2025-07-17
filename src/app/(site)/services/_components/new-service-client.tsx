"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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

import { NewServiceCard } from "./new-service-card";
import { type ServiceWithShop } from "~/types/service";
import { usePagination, DOTS } from "~/hooks/use-pagination";

const STORE_ATTRIBUTES = [
  "African American Culture", "African Culture", "African American Civil Rights",
  "Black Owned", "Woman Owned", "Community Education", "Food Sovereignty",
];

const FilterControls = memo(function FilterControls({
  searchTerm, setSearchTerm, stores, selectedStore, setSelectedStore, sortOrder, setSortOrder,
  selectedAttributes, setSelectedAttributes, resetFilters,
}: {
  searchTerm: string; setSearchTerm: (value: string) => void; stores: { id: string; name: string }[] | undefined;
  selectedStore: string; setSelectedStore: (value: string) => void; sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void; selectedAttributes: string[];
  setSelectedAttributes: (value: string[]) => void; resetFilters: () => void;
}) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Search</h3>
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Store</h3>
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger><SelectValue placeholder="Filter by store" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {stores?.map((store) => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        <h3 className="font-medium text-slate-900">Sort</h3>
        <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
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
                id={`service-${attribute}`}
                checked={selectedAttributes.includes(attribute)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedAttributes([...selectedAttributes, attribute]);
                  } else {
                    setSelectedAttributes(selectedAttributes.filter((attr) => attr !== attribute));
                  }
                }}
              />
              <Label htmlFor={`service-${attribute}`} className="text-sm text-slate-600">{attribute}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export function NewServiceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const searchTerm = searchParams.get("search") ?? "";
  const selectedStore = searchParams.get("store") ?? "all";
  const selectedAttributes = useMemo(() => searchParams.get("attributes")?.split(",").filter(Boolean) ?? [], [searchParams]);
  const sortOrder = (searchParams.get("sort") as "asc" | "desc") ?? "asc";
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const itemsPerPage = parseInt(searchParams.get("limit") ?? "20", 10);

  const updateSearchParams = useCallback((newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    if (!('page' in newParams)) {
      params.delete('page');
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);
  
  const { data: serviceData, isLoading } = api.service.getAllValid.useQuery({
    page: currentPage,
    limit: itemsPerPage,
  });
  const { data: stores } = api.shop.getAllValid.useQuery();

  const resetFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const filteredServices = useMemo(() => {
    if (!serviceData?.services) return [];
    
    return serviceData.services
      .filter((service) => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || service.name.toLowerCase().includes(searchTermLower) || service.description.toLowerCase().includes(searchTermLower);
        const matchesStore = selectedStore === "all" || !selectedStore || service.shopId === selectedStore;
        const matchesAttributes = selectedAttributes.length === 0 || selectedAttributes.every((attr) => service.shop?.attributeTags?.includes(attr));
        return matchesSearch && matchesStore && matchesAttributes;
      })
      .sort((a, b) => sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  }, [serviceData?.services, searchTerm, selectedStore, selectedAttributes, sortOrder]);

  const paginationRange = usePagination({
    currentPage,
    totalCount: filteredServices.length,
    siblingCount: 1,
    pageSize: itemsPerPage,
  });

  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredServices, currentPage, itemsPerPage]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mt-5 flex flex-col gap-6 md:flex-row">
      <aside className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:w-72 md:shrink-0 md:sticky md:top-4 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto">
        <FilterControls
          searchTerm={searchTerm}
          setSearchTerm={(value) => updateSearchParams({ search: value })}
          stores={stores}
          selectedStore={selectedStore}
          setSelectedStore={(value) => updateSearchParams({ store: value })}
          sortOrder={sortOrder}
          setSortOrder={(value) => updateSearchParams({ sort: value })}
          selectedAttributes={selectedAttributes}
          setSelectedAttributes={(value) => updateSearchParams({ attributes: value.join(',') })}
          resetFilters={resetFilters}
        />
      </aside>
      <main className="flex-1 space-y-6 px-4 md:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredServices.length > 0 ? ((currentPage-1) * itemsPerPage) + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredServices.length)} of {filteredServices.length} services
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm font-medium">Items per page:</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => updateSearchParams({ limit: Number(e.target.value), page: 1 })}
              className="h-8 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {paginatedServices.map((service) => (
            <NewServiceCard
              key={service.id}
              service={{
                ...service,
                shop: service.shop || undefined,
              }}
            />
          ))}
        </div>

        {filteredServices.length === 0 && (
          <p className="text-center text-muted-foreground">No services found for the selected filters.</p>
        )}

        {paginationRange && paginationRange.length > 1 && (
          <div className="flex justify-center items-center gap-2 py-6">
            <Button onClick={() => updateSearchParams({ page: currentPage - 1 })} disabled={currentPage === 1}>Previous</Button>
            <div className="flex items-center gap-1">
              {paginationRange.map((pageNumber, index) => {
                if (pageNumber === DOTS) {
                  return <span key={`dots-${index}`} className="px-2 text-sm">...</span>;
                }
                return (
                  <Button
                    key={pageNumber}
                    onClick={() => updateSearchParams({ page: pageNumber as number })}
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size="icon"
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            <Button
              onClick={() => updateSearchParams({ page: currentPage + 1 })}
              disabled={currentPage === Math.ceil(filteredServices.length / itemsPerPage)}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
