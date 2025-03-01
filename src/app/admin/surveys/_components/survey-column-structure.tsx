import type { ColumnDef } from "@tanstack/react-table";

import type { Survey } from "~/types/survey";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";

import { ItemDialog } from "../../_components/item-dialog";
import { DeleteSurveyDialog } from "./delete-survey-dialog";
import { SurveyForm } from "./survey-form";
import { ViewSurveyDialog } from "./view-survey-dialog";

export const surveyColumns: ColumnDef<Survey & { isAdmin: boolean }>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">{row.original.id}</span>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    accessorFn: (row) => row.ownerId,
    filterFn: "arrIncludesSome",
    cell: ({ row }) => (
      <div className="flex flex-col space-y-1">
        <span className="text-xs text-muted-foreground">
          Owner ID: {row.original.ownerId}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <AdvancedDataTableColumnHeader column={column} title="Created on" />
    ),
    cell: ({ row }) => (
      <span className="text-sm text-gray-500">
        {row.original.createdAt.toLocaleDateString()}
      </span>
    ),
  },
  {
    id: "options",
    header: "Options",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <ViewSurveyDialog survey={row.original} />

        {row.original.isAdmin && (
          <DeleteSurveyDialog surveyId={row.original.id} />
        )}

        <ItemDialog
          id={row.original.id}
          title="Update survey"
          subtitle="Make changes to the survey"
          initialData={row.original}
          FormComponent={SurveyForm}
          contentClassName="sm:max-w-6xl"
          mode="update"
        />
      </div>
    ),
  },
];
