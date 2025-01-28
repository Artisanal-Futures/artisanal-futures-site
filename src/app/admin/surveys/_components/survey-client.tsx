"use client";

import type { FilterOption } from "~/components/tables/advanced-data-table";
import type { Survey } from "~/types/survey";
import { usePermissions } from "~/hooks/use-permissions";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ItemDialog } from "../../_components/item-dialog";
import { surveyColumns } from "./survey-column-structure";
import { createSurveyFilters } from "./survey-filters";
import { SurveyForm } from "./survey-form";

type Props = { surveys: Survey[] };

export function SurveyClient({ surveys }: Props) {
  const { isAdmin } = usePermissions();

  const surveyFilter = createSurveyFilters(surveys, isAdmin);

  const elevatedSurveyData = surveys.map((survey) => ({
    ...survey,
    isAdmin,
  }));

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="createdAt"
        searchPlaceholder="Filter by date..."
        columns={surveyColumns}
        data={elevatedSurveyData ?? []}
        filters={surveyFilter as FilterOption[]}
        defaultColumnVisibility={{
          owner: isAdmin,
        }}
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
