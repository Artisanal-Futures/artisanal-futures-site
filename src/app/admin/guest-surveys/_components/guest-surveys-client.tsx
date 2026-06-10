"use client";

import { useMemo, useState } from "react";

import { type RowSelectionState } from "@tanstack/react-table";

import type { GuestSurvey } from "generated/prisma";

import type { GuestSurveyColumn } from "../_validators/types";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ExportAsCSV } from "./export-as-csv";
import { GuestSurveyBulkActions } from "./guest-survey-bulk-actions";
import { guestSurveyColumnStructure } from "./guest-survey-column-structure";

type Props = { guests: GuestSurvey[] };

export function GuestSurveysClient({ guests }: Props) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const castGuests = guests as GuestSurveyColumn[];

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => castGuests[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, castGuests]);

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="user"
        columns={guestSurveyColumnStructure}
        mobileHiddenColumnIds={["createdAt", "prompt"]}
        data={castGuests}
        selectionActions={
          <GuestSurveyBulkActions
            selectedIds={selectedIds}
            onClear={() => setRowSelection({})}
          />
        }
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        addButton={<ExportAsCSV surveys={guests} />}
      />
    </div>
  );
}
