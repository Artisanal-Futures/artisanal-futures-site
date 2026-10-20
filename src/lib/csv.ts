export type CsvCell = string | number | null | undefined;

// Spreadsheet apps treat cells starting with these characters as formulas.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value: CsvCell): string {
  let text = value === null || value === undefined ? "" : String(value);
  // Neutralise formula injection (CSV injection) by prefixing a single quote.
  if (typeof value === "string" && FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

/** Serialises rows to CSV, quoting every field and escaping embedded quotes. */
export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
}

/** Triggers a browser download of the given CSV text (with a UTF-8 BOM for Excel). */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** `YYYY-MM-DD` for today, for use in export filenames. */
export function datestamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** ISO-8601 string for a date column, or an empty string when invalid. */
export function isoDate(value: Date | string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}
