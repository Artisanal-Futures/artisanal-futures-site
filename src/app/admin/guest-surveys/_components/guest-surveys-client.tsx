"use client";

import type { GuestSurvey } from "@prisma/client";

import type { GuestSurveyColumn } from "../_validators/types";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ExportAsCSV } from "./export-as-csv";
import { guestSurveyColumnStructure } from "./guest-survey-column-structure";

type Props = { guests: GuestSurvey[] };

export function GuestSurveysClient({ guests }: Props) {
  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="user"
        columns={guestSurveyColumnStructure}
        data={guests as GuestSurveyColumn[]}
        addButton={<ExportAsCSV surveys={guests} />}
      />
    </div>
  );
}
