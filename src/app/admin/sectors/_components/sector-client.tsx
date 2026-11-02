"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type PaginationState } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { sectorColumns } from "./sector-column-structure";

export function SectorClient({
  sectors,
}: {
  sectors: RouterOutputs["shopSector"]["getAllForAdmin"];
}) {
  // The row order is the display order, so show it all on one page.
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });

  const addButtonNode = useMemo(
    () => (
      <Link
        href="/admin/sectors/new"
        className={cn(buttonVariants({ variant: "default" }), "h-8 text-xs")}
      >
        <PlusIcon className="mr-1 h-4 w-4" />
        New Sector
      </Link>
    ),
    [],
  );

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="name"
        searchPlaceholder="Search by name..."
        columns={sectorColumns}
        mobileHiddenColumnIds={["shortName"]}
        data={sectors}
        addButton={addButtonNode}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  );
}
