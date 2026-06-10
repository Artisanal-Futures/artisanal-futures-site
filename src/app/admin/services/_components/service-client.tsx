"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";

import type { RouterOutputs } from "~/trpc/react";
import type { ServiceWithShop } from "~/types/service";
import { cn } from "~/lib/utils";
import { usePermissions } from "~/hooks/use-permissions";
import { buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ServiceBulkActions } from "./service-bulk-actions";
import { serviceColumns } from "./service-column-structure";
import { createServiceFilter } from "./service-filters";

type Props = {
  services: ServiceWithShop[];
  shops: RouterOutputs["shop"]["getAll"];
};

export function ServiceClient({ services, shops }: Props) {
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

  const selectedServiceIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => services[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, services]);

  const serviceFilters = useMemo(
    () => createServiceFilter(services ?? [], shops ?? []),
    [services, shops],
  );

  const enhancedServices = useMemo(() => {
    return (services ?? []).map((service) => ({
      ...service,
      searchableString:
        `${service.name} ${service.description} ${service.id}`.toLowerCase(),
    }));
  }, [services]);

  const addButtonNode = useMemo(
    () => (
      <>
        <Link
          href="/admin/services/new"
          className={cn(buttonVariants({ variant: "default" }), "h-8 text-xs")}
        >
          New Service
        </Link>
      </>
    ),
    [],
  );

  const columnVisibility = useMemo(
    () => ({ user_id: isElevated }),
    [isElevated],
  );

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="searchableString"
        searchPlaceholder="Search by title, description, or ID..."
        columns={serviceColumns}
        mobileHiddenColumnIds={["shopId", "categories", "priceInCents"]}
        data={enhancedServices}
        filters={serviceFilters}
        selectionActions={
          <ServiceBulkActions
            selectedServiceIds={selectedServiceIds}
            onClear={() => setRowSelection({})}
          />
        }
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
