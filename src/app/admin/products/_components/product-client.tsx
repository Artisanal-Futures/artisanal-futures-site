"use client";

import Link from "next/link";
import { AlertCircleIcon } from "lucide-react";

import { type Product } from "~/types/product";
import { env } from "~/env";
import { cn } from "~/lib/utils";
import { usePermissions } from "~/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ItemDialog } from "../../_components/item-dialog";
import { createProjectFilter } from "./product-filters";
import { ProjectForm } from "./product-form";
import { projectColumns } from "./project-column-structure";

type Props = { products: Product[] };

export function ProductClient({ products }: Props) {
  const { isElevated, userRole } = usePermissions();

  const productFilters = createProjectFilter(products ?? [], isElevated);

  const enhancedProducts = products.map((product) => ({
    ...product,
    searchableString:
      `${product.name} ${product.description} ${product.id}`.toLowerCase(),
  }));

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="searchableString"
        searchPlaceholder="Search by title, description, or ID..."
        columns={projectColumns}
        data={enhancedProducts ?? []}
        filters={productFilters}
        defaultColumnVisibility={{
          user_id: isElevated,
        }}
        addButton={
          <>
            {" "}
            <Link
              href="/admin/products/migrate"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-8 text-xs",
              )}
            >
              Migrate Products
            </Link>
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
