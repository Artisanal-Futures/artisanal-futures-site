"use client";

import { useMemo, useState } from "react";

import { type RowSelectionState } from "@tanstack/react-table";

import type { UpcyclingColumn } from "../_validators/types";
import type { UpcyclingItem } from "~/types";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ExportAsCSV } from "./export-as-csv";
import { UpcyclingBulkActions } from "./upcycling-bulk-actions";
import { upcyclingColumnStructure } from "./upcycling-column-structure";

type Props = { upcycling: UpcyclingItem[] };

export function UpcyclingClient({ upcycling }: Props) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const castUpcycling = upcycling as UpcyclingColumn[];

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => castUpcycling[parseInt(index, 10)]?.id)
      .filter((id): id is number => id !== undefined);
  }, [rowSelection, castUpcycling]);

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="user"
        columns={upcyclingColumnStructure}
        mobileHiddenColumnIds={["generation_date", "prompt", "like"]}
        data={castUpcycling}
        selectionActions={
          <UpcyclingBulkActions
            selectedIds={selectedIds}
            onClear={() => setRowSelection({})}
          />
        }
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        addButton={<ExportAsCSV upcycling={upcycling} />}
      />
    </div>
  );
}
