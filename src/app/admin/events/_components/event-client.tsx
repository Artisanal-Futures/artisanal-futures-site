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

import { EventBulkActions } from "./event-bulk-actions";
import { eventColumns } from "./event-column-structure";
import { createEventFilter } from "./event-filters";

export function EventClient({
  events,
}: {
  events: RouterOutputs["event"]["getAll"];
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

  const selectedEventIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => events[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, events]);

  const eventFilters = useMemo(
    () => createEventFilter(events ?? []),
    [events],
  );

  const addButtonNode = useMemo(
    () => (
      <>
        <Link
          href="/admin/events/new"
          className={cn(buttonVariants({ variant: "default" }), "h-8 text-xs")}
        >
          <PlusIcon className="mr-1 h-4 w-4" />
          New Event
        </Link>
      </>
    ),
    [],
  );

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="title"
        searchPlaceholder="Search by title..."
        columns={eventColumns}
        mobileHiddenColumnIds={["shop", "startDate"]}
        data={events}
        filters={eventFilters}
        selectionActions={
          selectedEventIds.length > 0 ? (
            <EventBulkActions
              selectedEventIds={selectedEventIds}
              onClear={() => setRowSelection({})}
            />
          ) : undefined
        }
        defaultColumnVisibility={{ shopId: false }}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        addButton={addButtonNode}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  );
}
