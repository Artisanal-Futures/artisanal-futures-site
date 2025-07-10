"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import debounce from "lodash/debounce";

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

const STORE_ATTRIBUTES = [
  "African American Culture",
  "African Culture",
  "African American Civil Rights",
  "Black Owned",
  "Woman Owned",
  "Community Education",
  "Food Sovereignty",
];

const USE_SIDEBAR = true;

const FilterControls = memo(function FilterControls({
  searchTerm,
  setSearchTerm,
  stores,
  selectedStore,
  setSelectedStore,
  sortOrder,
  setSortOrder,
  selectedAttributes,
  setSelectedAttributes,
  resetFilters,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  stores: { id: string; name: string }[] | undefined;
  selectedStore: string;
  setSelectedStore: (value: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (value: "asc" | "desc") => void;
  selectedAttributes: string[];
  setSelectedAttributes: (value: string[]) => void;
  resetFilters: () => void;
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
          <SelectTrigger>
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
          onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by name" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Name (A-Z)</SelectItem>
            <SelectItem value="desc">Name (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-900">Store Attributes</h3>
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
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedAttributes([...selectedAttributes, attribute]);
                  } else {
                    setSelectedAttributes(
                      selectedAttributes.filter((attr) => attr !== attribute),
                    );
                  }
                }}
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
});

export function NewServiceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") ?? "",
  );
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedStore, setSelectedStore] = useState(
    searchParams.get("store") ?? "",
  );
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(
    searchParams.get("attributes")?.split(",").filter(Boolean) ?? [],
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("sort") as "asc" | "desc") ?? "asc",
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") ?? "1", 10),
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get("limit") ?? "20", 10),
  );

  const { data: serviceData, isLoading } = api.service.getAllValid.useQuery({
    page: currentPage,
    limit: itemsPerPage,
  });
  const { data: stores } = api.shop.getAllValid.useQuery();

  const debouncedSetSearchTerm = useMemo(
    () =>
      debounce((term: string) => {
        setDebouncedSearchTerm(term);
      }, 750),
    [],
  );

  useEffect(() => {
    debouncedSetSearchTerm(searchTerm);
    return () => debouncedSetSearchTerm.cancel();
  }, [searchTerm, debouncedSetSearchTerm]);

  const debouncedUpdateSearchParams = useMemo(
    () =>
      debounce((params: URLSearchParams) => {
        router.push(params.toString() ? `?${params.toString()}` : "", {
          scroll: false,
        });
      }, 300),
    [router],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    if (selectedStore) params.set("store", selectedStore);
    if (selectedAttributes.length > 0)
      params.set("attributes", selectedAttributes.join(","));
    if (sortOrder) params.set("sort", sortOrder);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (itemsPerPage !== 20) params.set("limit", itemsPerPage.toString());

    debouncedUpdateSearchParams(params);
    return () => debouncedUpdateSearchParams.cancel();
  }, [
    debouncedSearchTerm,
    selectedStore,
    selectedAttributes,
    sortOrder,
    currentPage,
    itemsPerPage,
    debouncedUpdateSearchParams,
  ]);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedStore("");
    setSelectedAttributes([]);
    setSortOrder("asc");
    setCurrentPage(1);
    setItemsPerPage(20);
    router.push("", { scroll: false });
  }, [router]);

  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

  // CHANGED: Logic adapted for services
  const filteredServices = useMemo(() => {
    if (!serviceData?.services) return [];

    return serviceData.services
      .filter((service) => {
        const searchTermLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch =
          service.name.toLowerCase().includes(searchTermLower) ||
          stripHtmlTags(service.description)
            .toLowerCase()
            .includes(searchTermLower) ||
          service.tags.some((tag) =>
            tag.toLowerCase().includes(searchTermLower),
          ) ||
          service.attributeTags.some((tag) =>
            tag.toLowerCase().includes(searchTermLower),
          ) ||
          service.aiGeneratedTags.some((tag) =>
            tag.toLowerCase().includes(searchTermLower),
          );

        const matchesStore =
          selectedStore === "all" ||
          !selectedStore ||
          service.shopId === selectedStore;
        const matchesAttributes =
          selectedAttributes.length === 0 ||
          selectedAttributes.every((attr) =>
            service.shop?.attributeTags?.includes(attr),
          );

        return matchesSearch && matchesStore && matchesAttributes;
      })
      .sort((a, b) =>
        sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name),
      );
  }, [
    serviceData?.services,
    debouncedSearchTerm,
    selectedStore,
    selectedAttributes,
    sortOrder,
  ]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return USE_SIDEBAR ? (
    <div className="mt-5 flex flex-col gap-6 md:flex-row">
      <aside className="sticky top-4 h-fit w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:w-72 md:shrink-0">
        <FilterControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          stores={stores}
          selectedStore={selectedStore}
          setSelectedStore={setSelectedStore}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          selectedAttributes={selectedAttributes}
          setSelectedAttributes={setSelectedAttributes}
          resetFilters={resetFilters}
        />
      </aside>
      <div className="flex-1 space-y-6 px-4 md:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {serviceData?.totalCount !== undefined && (
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {filteredServices.length > 0
                ? (currentPage - 1) * itemsPerPage + 1
                : 0}{" "}
              to {Math.min(currentPage * itemsPerPage, serviceData.totalCount)}{" "}
              of {serviceData.totalCount} services
            </p>
          )}
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm font-medium">
              Items per page:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
              className="h-8 w-24 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <NewServiceCard
              key={service.id}
              service={{
                ...service,
                shop: service.shop ?? undefined,
              }}
            />
          ))}
        </div>
        {filteredServices.length === 0 && (
          <p className="text-center text-muted-foreground">No services found</p>
        )}

        {serviceData?.totalPages && serviceData.totalPages > 1 && (
          <div className="flex justify-center gap-2 py-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from(
                { length: serviceData?.totalPages ?? 0 },
                (_, i) => i + 1,
              ).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    currentPage === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, serviceData?.totalPages ?? 1),
                )
              }
              disabled={currentPage >= (serviceData?.totalPages ?? 1)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div>...</div>
  );
}