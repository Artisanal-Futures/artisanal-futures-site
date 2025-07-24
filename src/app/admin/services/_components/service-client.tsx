"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { type RowSelectionState, type PaginationState } from "@tanstack/react-table";
import { useSearchParams, useRouter } from "next/navigation";

import { cn } from "~/lib/utils";
import type { ServiceWithShop } from "~/types/service";
import type { Shop } from "~/types/shop";

import { usePermissions } from "~/hooks/use-permissions";
import { Button, buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ItemDialog } from "../../_components/item-dialog";
import { BulkServiceForm } from "./bulk-service-form";
import { ServiceForm } from "./service-form"; // Assumes this is the correct path
import { serviceColumns } from "./service-column-structure";
import { createServiceFilter } from "./service-filters";

type Props = {
  services: ServiceWithShop[];
  shops: Shop[];
};

export function ServiceClient({ services, shops }: Props) {
  const { isElevated } = usePermissions();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: searchParams.get("page") ? Number(searchParams.get("page")) - 1 : 0,
    pageSize: searchParams.get("limit") ? Number(searchParams.get("limit")) : 10,
  });

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    const ids = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => services[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
    setSelectedServiceIds(ids);
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
    [selectedServiceIds, services, router]
  );

  const columnVisibility = useMemo(
    () => ({
      user_id: isElevated,
    }),
    [isElevated]
  );

  const columns = useMemo(() => serviceColumns, []);

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="searchableString"
        searchPlaceholder="Search by title, description, or ID..."
        columns={columns}
        data={enhancedServices}
        filters={serviceFilters}
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