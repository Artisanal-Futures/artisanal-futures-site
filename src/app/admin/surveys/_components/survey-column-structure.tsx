import type { User } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";

import type { Survey } from "~/types/survey";
import { AdvancedDataTableColumnHeader } from "~/components/tables/advanced-data-table-header";

import { ItemDialog } from "../../_components/item-dialog";
import { DeleteSurveyDialog } from "./delete-survey-dialog";
import { SurveyForm } from "./survey-form";

export const surveyColumns: ColumnDef<Survey>[] = [
  {
    accessorKey: "processes",
    header: "Processes",
    accessorFn: (row) => row.processes,
    filterFn: "includesString",
    cell: ({ row }) => (
      <div className="flex flex-col space-y-1">
        <span>{row.original.processes}</span>
      </div>
    ),
  },
  {
    accessorKey: "materials",
    header: "Materials",
    accessorFn: (row) => row.materials,
    filterFn: "includesString",
    cell: ({ row }) => (
      <div className="flex flex-col space-y-1">
        <span>{row.original.materials}</span>
      </div>
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
        <DeleteSurveyDialog shopId={row.original.id} />

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
