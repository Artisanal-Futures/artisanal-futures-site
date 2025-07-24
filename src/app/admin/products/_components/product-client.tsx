"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type RowSelectionState, type PaginationState } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";

import { cn } from "~/lib/utils";
import type { ProductWithRelations } from "~/types/product";
import type { Shop } from "~/types/shop";

import { usePermissions } from "~/hooks/use-permissions";
import { buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ItemDialog } from "../../_components/item-dialog";
import { BulkProductFormWrapper } from "./bulk-product-form-wrapper";
import { ProjectForm } from "./product-form";
import { productColumns } from "./product-column-structure";
import { createProductFilter } from "./product-filters";

type Props = {
  products: ProductWithRelations[];
  shops: Shop[];
};

export function ProductClient({ products, shops }: Props) {
  const { isElevated } = usePermissions();
  const searchParams = useSearchParams();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: searchParams.get("page") ? Number(searchParams.get("page")) - 1 : 0,
    pageSize: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
  });

  const selectedProductIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => products[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, products]);

  const productFilters = useMemo(() => createProductFilter(products ?? [], shops ?? []), [
    products,
    shops,
  ]);

  const enhancedProducts = useMemo(() => {
    return (products ?? []).map((product) => ({
      ...product,
      searchableString: `${product.name} ${product.description} ${product.id}`.toLowerCase(),
    }));
  }, [products]);

  const toolbarActionsNode = useMemo(() => {
    if (selectedProductIds.length === 0) return null;

    return (
      <ItemDialog
        title={`Bulk Edit ${selectedProductIds.length} Products`}
        subtitle="Apply changes to all selected products."
        FormComponent={BulkProductFormWrapper}
        initialData={{
          selectedProductIds: selectedProductIds,
          clearRowSelection: () => setRowSelection({}),
        }}
        buttonText={`Bulk Edit (${selectedProductIds.length})`}
        buttonClassName="h-8 text-xs"
        preventCloseOnOutsideClick={true}
      />
    );
  }, [selectedProductIds]);

  const addButtonNode = useMemo(
    () => (
      <>
        {process.env.NODE_ENV === "development" && (
          <Link
            href="/admin/products/migrate"
            className={cn(buttonVariants({ variant: "outline" }), "h-8 text-xs")}
          >
            Migrate Products
          </Link>
        )}
        <ItemDialog
          title="Create project"
          subtitle="Create a new project"
          FormComponent={ProjectForm}
          type="project"
          mode="create"
        />
      </>
    ),
    []
  );

  const columnVisibility = useMemo(
    () => ({ user_id: isElevated }),
    [isElevated]
  );

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="searchableString"
        searchPlaceholder="Search by title, description, or ID..."
        columns={productColumns}
        data={enhancedProducts}
        filters={productFilters}
        toolbarActions={toolbarActionsNode}
        defaultColumnVisibility={columnVisibility}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        addButton={addButtonNode}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  );
}