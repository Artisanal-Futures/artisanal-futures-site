import Papa from "papaparse";

import type { ImportType } from "./parse-rows";

import { getColumns } from "./parse-rows";

/**
 * Build the downloadable starter file: the header row plus the two worked
 * examples carried on each `ColumnDef`. The examples double as documentation —
 * an artisan can overwrite them row by row without reading anything else.
 */
export function buildTemplateCsv(type: ImportType): string {
  const columns = getColumns(type);

  return Papa.unparse({
    fields: columns.map((column) => column.header),
    data: [
      columns.map((column) => column.examples[0]),
      columns.map((column) => column.examples[1]),
    ],
  });
}

export function templateFileName(type: ImportType): string {
  return type === "products"
    ? "products-template.csv"
    : "services-template.csv";
}
