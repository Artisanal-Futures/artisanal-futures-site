"use client";

import type { UpcyclingColumn } from "../_validators/types";
import type { UpcyclingItem } from "~/types";
import { AdvancedDataTable } from "~/components/tables/advanced-data-table";

import { ExportAsCSV } from "./export-as-csv";
import { upcyclingColumnStructure } from "./upcycling-column-structure";

type Props = { upcycling: UpcyclingItem[] };

export function UpcyclingClient({ upcycling }: Props) {
  return (
    <div className="py-4">
      <AdvancedDataTable
        searchKey="user"
        columns={upcyclingColumnStructure}
        data={upcycling as UpcyclingColumn[]}
        addButton={<ExportAsCSV upcycling={upcycling} />}
      />
    </div>
  );
}
