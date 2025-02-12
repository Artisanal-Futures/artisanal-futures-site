"use client";

import Link from "next/link";

import type { Product } from "~/types/product";
import type { Shop } from "~/types/shop";
import { cn } from "~/lib/utils";
import { usePermissions } from "~/hooks/use-permissions";
import { Button, buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ItemDialog } from "../../_components/item-dialog";
import { productColumns } from "./product-column-structure";
import { createProductFilter } from "./product-filters";
import { ProjectForm } from "./product-form";
import { TagProductsButton } from "./tag-products-button";

type Props = { products: Product[]; shops: Shop[] };

export function ProductClient({ products, shops }: Props) {
  const { isElevated } = usePermissions();

  const productFilters = createProductFilter(products ?? [], shops ?? []);

  const enhancedProducts = products.map((product) => ({
    ...product,
    searchableString:
      `${product.name} ${product.description} ${product.id}`.toLowerCase(),
  }));

  const handlePrintProducts = () => {
    const formattedProducts = products.reduce(
      (acc, product) => {
        acc[product.id] =
          `${product.name} - ${product.description} - ${product.tags.join(", ")}`;
        return acc;
      },
      {} as Record<string, string>,
    );

    console.log(formattedProducts);
  };

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
        addButton={
          <>
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
            <Button
              variant="outline"
              className="h-8 text-xs"
              onClick={handlePrintProducts}
            >
              Print Products
            </Button>
            <ItemDialog
              title={`Create project`}
              subtitle="Create a new project"
              FormComponent={ProjectForm}
              type="project"
              mode="create"
            />
            <TagProductsButton />
          </>
        }
      />
    </div>
  );
}
