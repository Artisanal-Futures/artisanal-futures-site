"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type Category } from "generated/prisma";

import type { RouterOutputs } from "~/trpc/react";
import { type ProductWithRelations } from "~/types/product";
import { api } from "~/trpc/react";
import { FilterControls } from "~/app/(site)/(shops-goods-services)/_components/filter-controls";
import { Pagination } from "~/app/(site)/(shops-goods-services)/_components/pagination";

import { ProductCard } from "../../../_components/product-card";
import { ProductDetailDialog } from "../../../_components/product-detail-dialog";

type Product = NonNullable<RouterOutputs["shop"]["get"]>["products"][number];
type Service = NonNullable<RouterOutputs["shop"]["get"]>["services"][number];

type Props = {
  initialProducts: ProductWithRelations[];
  subcategories?: Category[];
  totalCount: number;
  totalPages: number;
};

export function CategoryClient({
  initialProducts,
  subcategories,
  totalCount,
  totalPages,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const itemsPerPage = parseInt(searchParams.get("limit") ?? "20", 10);
  const currentPage = Math.max(1, Math.min(totalPages, rawPage));

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

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const { data: stores } = api.shop.getAllPublic.useQuery();
  const resetFilters = useCallback(
    () => router.push(pathname, { scroll: false }),
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
            {(currentPage - 1) * itemsPerPage + initialProducts.length} of{" "}
            {totalCount} products
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

        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gridAutoRows: "min-content" }}
        >
          {initialProducts.map((product) => (
            <ProductCard
              key={product.id}
              item={product as Product}
              onClick={() => handleItemClick(product as Product)}
              createdBy={product?.shop?.name ?? ""}
              shopPrinciples={product?.shop?.attributeTags ?? []}
              fallbackImage={product?.shop?.logoPhoto}
            />
          ))}
        </div>

        {initialProducts.length === 0 && (
          <p className="text-muted-foreground text-center">
            No products found for the selected filters.
          </p>
        )}

        <ProductDetailDialog
          item={selectedItem as Product}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          createdBy={(selectedItem as ProductWithRelations)?.shop?.name ?? ""}
          shopPrinciples={
            (selectedItem as ProductWithRelations)?.shop?.attributeTags ?? []
          }
          linkToProfile={`/shops/${(selectedItem as ProductWithRelations)?.shop?.id}`}
          fallbackImage={(selectedItem as ProductWithRelations)?.shop?.logoPhoto}
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
