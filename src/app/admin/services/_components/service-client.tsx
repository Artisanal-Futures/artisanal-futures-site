"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { PencilIcon, XCircleIcon } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import type { ServiceWithShop } from "~/types/service";
import type { Shop } from "~/types/shop";
import { cn } from "~/lib/utils";
import { usePermissions } from "~/hooks/use-permissions";
import { Button, buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ItemDialog } from "../../_components/item-dialog";
import { BulkServiceFormWrapper } from "./bulk-service-form-wrapper";
import { DeleteMultipleServicesDialog } from "./delete-multiple-services";
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

  const toolbarActionsNode = useMemo(() => {
    if (selectedServiceIds.length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        {/* <ItemDialog
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
        /> */}

        <DeleteMultipleServicesDialog
          serviceIds={selectedServiceIds}
          onSuccessCallback={() => setRowSelection({})}
        />
        <Button
          variant="destructive"
          onClick={() => setRowSelection({})}
          className="h-8 bg-red-500 px-2 text-xs lg:px-3"
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
        {/* <Link
          href="/admin/services/migrate"
          className={cn(buttonVariants({ variant: "outline" }), "h-8 text-xs")}
        >
          Migrate Services
        </Link> */}

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
