"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type Category } from "generated/prisma";

import type { RouterOutputs } from "~/trpc/react";
import { type ServiceWithShop } from "~/types/service";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { FilterControls } from "~/app/(site)/(shops-goods-services)/_components/filter-controls";
import { Pagination } from "~/app/(site)/(shops-goods-services)/_components/pagination";
import { ProductCard } from "~/app/(site)/(shops-goods-services)/_components/product-card";
import { ProductDetailDialog } from "~/app/(site)/(shops-goods-services)/_components/product-detail-dialog";
import {
  ActiveFilterChips,
  FuzzyNotice,
  NoResults,
  ResultsSkeleton,
} from "~/app/(site)/(shops-goods-services)/_components/search-results-status";

type Product = NonNullable<RouterOutputs["shop"]["get"]>["products"][number];
type Service = NonNullable<RouterOutputs["shop"]["get"]>["services"][number];
type Props = {
  initialServices: ServiceWithShop[];
  subcategories?: Category[];
  totalCount: number;
  totalPages: number;
  isFuzzy?: boolean;
  suggestions?: string[];
};
export function ServiceCategoryClient({
  initialServices,
  subcategories,
  totalCount,
  totalPages,
  isFuzzy = false,
  suggestions = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const itemsPerPage = parseInt(searchParams.get("limit") ?? "20", 10);
  // Guard against totalPages === 0 (an empty result), which previously clamped
  // the page number to 0 and rendered "Showing 0–0 of 0".
  const currentPage = Math.max(1, Math.min(Math.max(totalPages, 1), rawPage));

  const searchTerm = searchParams.get("search") ?? "";
  const hasFilters = ["search", "store", "attributes", "subcategory"].some(
    (key) => !!searchParams.get(key),
  );

  const updateSearchParams = useCallback(
    (newParams: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          (key === "store" && value === "all")
        ) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      const isFilterChange = Object.keys(newParams).some(
        (key) => key !== "page" && key !== "limit",
      );
      if (isFilterChange) {
        params.delete("page");
      }

      // Wrapped in a transition so `isPending` can drive a loading state.
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const { data: stores } = api.shop.getAllPublic.useQuery();
  const resetFilters = useCallback(
    () => startTransition(() => router.push(pathname, { scroll: false })),
    [router, pathname],
  );

  const [selectedItem, setSelectedItem] = useState<Product | Service | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const handleItemClick = (item: Product | Service) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  return (
    <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-start">
      <aside className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:sticky md:top-4 md:max-h-[calc(100vh-8rem)] md:w-72 md:shrink-0 md:overflow-y-auto">
        <FilterControls
          updateSearchParams={updateSearchParams}
          resetFilters={resetFilters}
          subcategories={subcategories}
          stores={stores}
        />
      </aside>
      <section className="flex-1 space-y-6 px-4 md:px-8">
        <ActiveFilterChips
          updateSearchParams={updateSearchParams}
          resetFilters={resetFilters}
          stores={stores}
        />

        {isFuzzy && searchTerm && <FuzzyNotice query={searchTerm} />}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {totalCount > 0
              ? `Showing ${(currentPage - 1) * itemsPerPage + 1}–${
                  (currentPage - 1) * itemsPerPage + initialServices.length
                } of ${totalCount} services`
              : "No services to show"}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm font-medium">
              Items per page:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) =>
                updateSearchParams({ limit: Number(e.target.value) })
              }
              className="border-input bg-background h-8 w-24 rounded-md border px-2 py-1 text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {isPending && initialServices.length === 0 ? (
          <ResultsSkeleton />
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3",
              isPending && "opacity-60",
            )}
            style={{ gridAutoRows: "min-content" }}
          >
            {initialServices.map((service) => (
              <ProductCard
                key={service.id}
                item={service as Service}
                onClick={() => handleItemClick(service as Service)}
                createdBy={service?.shop?.name ?? ""}
                shopPrinciples={service?.shop?.attributeTags ?? []}
                fallbackImage={service?.shop?.logoPhoto}
                showPrice={false}
              />
            ))}
          </div>
        )}

        {initialServices.length === 0 && !isPending && (
          <NoResults
            noun="services"
            query={searchTerm}
            hasFilters={hasFilters}
            suggestions={suggestions}
            resetFilters={resetFilters}
            updateSearchParams={updateSearchParams}
          />
        )}

        <ProductDetailDialog
          item={selectedItem as Service}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          createdBy={(selectedItem as ServiceWithShop)?.shop?.name ?? ""}
          shopPrinciples={
            (selectedItem as ServiceWithShop)?.shop?.attributeTags ?? []
          }
          linkToProfile={`/shops/${(selectedItem as ServiceWithShop)?.shop?.id}`}
          fallbackImage={(selectedItem as ServiceWithShop)?.shop?.logoPhoto}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={itemsPerPage}
            onPageChange={(page) => updateSearchParams({ page })}
          />
        )}
      </section>
    </div>
  );
}
