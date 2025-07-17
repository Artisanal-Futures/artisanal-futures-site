"use client";

import { useState } from "react";
import Link from "next/link";
import { type RowSelectionState } from "@tanstack/react-table";
import { PencilIcon } from "lucide-react";

import type { ProductWithRelations } from "~/types/product";
import type { Shop } from "~/types/shop";
import { cn } from "~/lib/utils";
import { usePermissions } from "~/hooks/use-permissions";
import { Button, buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ItemDialog } from "../../_components/item-dialog";
import { productColumns } from "./product-column-structure";
import { createProductFilter } from "./product-filters";
import { ProjectForm } from "./product-form";
import { BulkProductForm } from "./bulk-product-form";

type Props = { products: ProductWithRelations[]; shops: Shop[] };

export function ProductClient({ products, shops }: Props) {
  const { isElevated } = usePermissions();
  
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const productFilters = createProductFilter(products ?? [], shops ?? []);

  const enhancedProducts = products.map((product) => ({
    ...product,
    searchableString:
      `${product.name} ${product.description} ${product.id}`.toLowerCase(),
  }));

  const selectedProductIds = Object.keys(rowSelection).filter(
    (key) => rowSelection[key]
  );

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="searchableString"
        searchPlaceholder="Search by title, description, or ID..."
        columns={productColumns}
        data={enhancedProducts ?? []}
        filters={productFilters}
        defaultColumnVisibility={{
          user_id: isElevated,
        }}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        addButton={
          <>
            {selectedProductIds.length > 0 && (
              <ItemDialog
                title={`Bulk Edit ${selectedProductIds.length} Products`}
                subtitle="Apply changes to all selected products."
                FormComponent={({ onSuccessCallback }) => (
                  <BulkProductForm
                    productIds={selectedProductIds}
                    onSuccessCallback={() => {
                      setRowSelection({}); 
                      onSuccessCallback();
                    }}
                  />
                )}
                buttonText={
                  <>
                    <PencilIcon className="mr-2 h-4 w-4" />
                    Bulk Edit ({selectedProductIds.length})
                  </>
                }
                buttonClassName="h-8 text-xs"
              />
            )}

            {process.env.NODE_ENV === "development" && (
              <Link
                href="/admin/products/migrate"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-8 text-xs",
                )}
              >
                Migrate Products
              </Link>
            )}
            <ItemDialog
              title={`Create project`}
              subtitle="Create a new project"
              FormComponent={ProjectForm}
              type="project"
              mode="create"
            />
          </>
        }
      />
    </div>
  );
}
