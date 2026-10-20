"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  type PaginationState,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";

import type { RouterOutputs } from "~/trpc/react";
import type { ServiceWithShop } from "~/types/service";
import { cn } from "~/lib/utils";
import { usePermissions } from "~/hooks/use-permissions";
import { buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ServiceBulkActions } from "./service-bulk-actions";
import { getServiceColumns } from "./service-column-structure";
import { createServiceFilter } from "./service-filters";

type Props = {
  services: ServiceWithShop[];
  shops: RouterOutputs["shop"]["getOptions"];
  /**
   * Narrows the table to one shop (the shop hub's Services tab). Hides the
   * shop column/filter and the global toolbar actions, and sends edit links
   * back to `returnTo`.
   */
  scope?: { shopId: string; returnTo: string };
};

export function ServiceClient({ services, shops, scope }: Props) {
  const { isAdmin } = usePermissions();
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
    () =>
      createServiceFilter(services ?? [], shops ?? [], {
        hideShopFilter: !!scope,
      }),
    [services, shops, scope],
  );

  const columns = useMemo(
    () => getServiceColumns({ returnTo: scope?.returnTo }),
    [scope?.returnTo],
  );

  const columnVisibility = useMemo(() => {
    const visibility: VisibilityState = {};
    if (scope) visibility.shopId = false;
    return visibility;
  }, [scope]);

  const enhancedServices = useMemo(() => {
    return (services ?? []).map((service) => ({
      ...service,
      searchableString:
        `${service.name} ${service.description} ${service.id}`.toLowerCase(),
    }));
  }, [services]);

  const addButtonNode = useMemo(
    () =>
      scope ? (
        <Link
          href={`/admin/services/new?shopId=${encodeURIComponent(scope.shopId)}&returnTo=${encodeURIComponent(scope.returnTo)}`}
          className={cn(buttonVariants({ variant: "default" }), "h-8 text-xs")}
        >
          New Service
        </Link>
      ) : (
        <>
          {isAdmin && (
            <Link
              href="/admin/csv-import?type=services"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-8 text-xs",
              )}
              title="Bulk-create services from a CSV file"
            >
              Import CSV
            </Link>
          )}

          <Link
            href="/admin/services/new"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-8 text-xs",
            )}
          >
            New Service
          </Link>
        </>
      ),
    [isAdmin, scope],
  );

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="searchableString"
        searchPlaceholder="Search by title, description, or ID..."
        columns={columns}
        defaultColumnVisibility={columnVisibility}
        mobileHiddenColumnIds={["shopId", "categories", "priceInCents"]}
        data={enhancedServices}
        filters={serviceFilters}
        selectionActions={
          <ServiceBulkActions
            selectedServiceIds={selectedServiceIds}
            onClear={() => setRowSelection({})}
          />
        }
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        addButton={addButtonNode}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  );
}
