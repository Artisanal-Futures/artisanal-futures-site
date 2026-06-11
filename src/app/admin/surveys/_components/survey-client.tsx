"use client";

import { useMemo, useState } from "react";

import { type RowSelectionState } from "@tanstack/react-table";

import type { FilterOption } from "~/components/tables/advanced-data-table";
import type { Survey } from "~/types/survey";
import { usePermissions } from "~/hooks/use-permissions";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ItemDialog } from "../../_components/item-dialog";
import { SurveyBulkActions } from "./survey-bulk-actions";
import { surveyColumns } from "./survey-column-structure";
import { createSurveyFilters } from "./survey-filters";
import { SurveyForm } from "./survey-form";

type Props = { surveys: Survey[] };

export function SurveyClient({ surveys }: Props) {
  const { isAdmin } = usePermissions();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const surveyFilter = createSurveyFilters(surveys, isAdmin);

  const elevatedSurveyData = surveys.map((survey) => ({
    ...survey,
    isAdmin,
  }));

  const selectedSurveyIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((index) => elevatedSurveyData[parseInt(index, 10)]?.id)
      .filter((id): id is string => !!id);
  }, [rowSelection, elevatedSurveyData]);

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="createdAt"
        searchPlaceholder="Filter by date..."
        columns={surveyColumns}
        mobileHiddenColumnIds={["owner", "createdAt"]}
        data={elevatedSurveyData ?? []}
        filters={surveyFilter as FilterOption[]}
        defaultColumnVisibility={{
          owner: isAdmin,
        }}
        selectionActions={
          <SurveyBulkActions
            selectedSurveyIds={selectedSurveyIds}
            onClear={() => setRowSelection({})}
          />
        }
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        addButton={
          isAdmin && (
            <ItemDialog
              title={`Create survey`}
              subtitle="Create a new survey"
              FormComponent={SurveyForm}
              type="survey"
              mode="create"
              contentClassName="max-w-5xl w-full"
            />
          )
        }
      />
    </div>
  );
}
