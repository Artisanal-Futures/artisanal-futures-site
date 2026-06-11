"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { CategoryBulkActions } from "./category-bulk-actions";
import { categoryColumns } from "./category-column-structure";
import { createCategoryFilter } from "./category-filters";

export function CategoryClient({
  categories,
}: {
  categories: RouterOutputs["category"]["getAll"];
}) {
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

  const selectedCategoryIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => categories[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, categories]);

  const categoryFilters = useMemo(
    () => createCategoryFilter(categories ?? []),
    [categories],
  );

  const addButtonNode = useMemo(
    () => (
      <>
        <Link
          href="/admin/categories/new"
          className={cn(buttonVariants({ variant: "default" }), "h-8 text-xs")}
        >
          <PlusIcon className="mr-1 h-4 w-4" />
          New Category
        </Link>
      </>
    ),
    [],
  );

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="name"
        searchPlaceholder="Search by name..."
        columns={categoryColumns}
        mobileHiddenColumnIds={["parent"]}
        data={categories}
        filters={categoryFilters}
        selectionActions={
          selectedCategoryIds.length > 0 ? (
            <CategoryBulkActions
              selectedCategoryIds={selectedCategoryIds}
              onClear={() => setRowSelection({})}
            />
          ) : undefined
        }
        defaultColumnVisibility={{ categoryType: false, parentId: false }}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        addButton={addButtonNode}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  );
}
