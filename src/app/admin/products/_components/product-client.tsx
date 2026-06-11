"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";

import type { RouterOutputs } from "~/trpc/react";
import type { ProductWithRelations } from "~/types/product";
import { cn } from "~/lib/utils";
import { usePermissions } from "~/hooks/use-permissions";
import { buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ProductBulkActions } from "./product-bulk-actions";
import { productColumns } from "./product-column-structure";
import { createProductFilter } from "./product-filters";

type Props = {
  products: ProductWithRelations[];
  shops: RouterOutputs["shop"]["getAll"];
};

export function ProductClient({ products, shops }: Props) {
  const { isElevated } = usePermissions();
  const searchParams = useSearchParams();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: searchParams.get("page")
      ? Number(searchParams.get("page")) - 1
      : 0,
    pageSize: searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 10,
  });

  const selectedProductIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => products[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, products]);

  const productFilters = useMemo(
    () => createProductFilter(products ?? [], shops ?? []),
    [products, shops],
  );

  const enhancedProducts = useMemo(() => {
    return (products ?? []).map((product) => ({
      ...product,
      searchableString:
        `${product.name} ${product.description} ${product.id}`.toLowerCase(),
    }));
  }, [products]);

  const addButtonNode = useMemo(
    () => (
      <>
        <Link
          href="/admin/products/migrate"
          className={cn(buttonVariants({ variant: "outline" }), "h-8 text-xs")}
        >
          Migrate Products
        </Link>

        <Link
          href="/admin/products/new"
          className={cn(buttonVariants({ variant: "default" }), "h-8 text-xs")}
        >
          New Product
        </Link>
      </>
    ),
    [],
  );

  const columnVisibility = useMemo(
    () => ({
      user_id: isElevated,
      categoryIds: false,
      priceStatus: false,
    }),
    [isElevated],
  );

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="searchableString"
        searchPlaceholder="Search by title, description, or ID..."
        columns={productColumns}
        data={enhancedProducts}
        filters={productFilters}
        selectionActions={
          <ProductBulkActions
            selectedProductIds={selectedProductIds}
            onClear={() => setRowSelection({})}
          />
        }
        defaultColumnVisibility={columnVisibility}
        mobileHiddenColumnIds={["shopId", "categories", "priceInCents"]}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        addButton={addButtonNode}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  );
}
