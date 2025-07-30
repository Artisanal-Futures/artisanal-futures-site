"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type RowSelectionState, type PaginationState } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";

import { cn } from "~/lib/utils";
import type { ServiceWithShop } from "~/types/service";
import type { Shop } from "~/types/shop";

import { usePermissions } from "~/hooks/use-permissions";
import { Button, buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ItemDialog } from "../../_components/item-dialog";
import { BulkServiceFormWrapper } from "./bulk-service-form-wrapper";
import { ServiceForm } from "./service-form";
import { serviceColumns } from "./service-column-structure";
import { createServiceFilter } from "./service-filters";
import { PencilIcon, XCircleIcon } from "lucide-react";

type Props = {
  services: ServiceWithShop[];
  shops: Shop[];
};

export function ServiceClient({ services, shops }: Props) {
  const { isElevated } = usePermissions();
  const searchParams = useSearchParams();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: searchParams.get("page") ? Number(searchParams.get("page")) - 1 : 0,
    pageSize: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
  });

  const selectedServiceIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => services[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, services]);

  const serviceFilters = useMemo(() => createServiceFilter(services ?? [], shops ?? []), [
    services,
    shops,
  ]);

  const enhancedServices = useMemo(() => {
    return (services ?? []).map((service) => ({
      ...service,
      searchableString: `${service.name} ${service.description} ${service.id}`.toLowerCase(),
    }));
  }, [services]);
  
  const toolbarActionsNode = useMemo(() => {
      if (selectedServiceIds.length === 0) return null;
  
      return (
        <div className="flex items-center gap-2">
          <ItemDialog
            title={`Bulk Edit ${selectedServiceIds.length} Products`}
            subtitle="Apply changes to all selected products."
            FormComponent={BulkServiceFormWrapper}
            initialData={{
              selectedServiceIds: selectedServiceIds,
              clearRowSelection: () => setRowSelection({}),
            }}
            buttonText={
              <>
                <PencilIcon className="mr-1 h-4 w-4" />
                Bulk Edit ({selectedServiceIds.length})
              </>
            }
            buttonClassName="h-8 text-xs"
            preventCloseOnOutsideClick={true}
          />
          <Button
            variant="destructive"
            onClick={() => setRowSelection({})}
            className="h-8 px-2 text-xs lg:px-3 bg-red-500"
          >
            <XCircleIcon className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      );
    }, [selectedServiceIds]);

  const addButtonNode = useMemo(
    () => (
      <>
        {process.env.NODE_ENV === "development" && (
          <Link
            href="/admin/services/migrate"
            className={cn(buttonVariants({ variant: "outline" }), "h-8 text-xs")}
          >
            Migrate Services
          </Link>
        )}
        <ItemDialog
          title="Create service"
          subtitle="Create a new service"
          FormComponent={ServiceForm}
          type="service"
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
        columns={serviceColumns}
        data={enhancedServices}
        filters={serviceFilters}
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