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
  const { isElevated } = usePermissions();

  const surveyFilter = createSurveyFilters(surveys, isElevated);

  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="surveyName"
        searchPlaceholder="Filter by survey name..."
        columns={surveyColumns}
        data={surveys ?? []}
        filters={surveyFilter as FilterOption[]}
        defaultColumnVisibility={{
          owner: isElevated,
        }}
        addButton={
          <ItemDialog
            title={`Create survey`}
            subtitle="Create a new survey"
            FormComponent={SurveyForm}
            type="survey"
            mode="create"
            contentClassName="max-w-5xl w-full"
          />
        }
      />
    </div>
  );
}
