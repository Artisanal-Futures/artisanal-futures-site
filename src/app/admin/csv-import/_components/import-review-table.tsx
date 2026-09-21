"use client";

import { useMemo, useState } from "react";

import type {
  ImportType,
  ProductCsvRow,
  ServiceCsvRow,
} from "~/lib/csv-import";
import type { AnalyzedRow } from "~/server/api/shared/csv-import";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type Row = AnalyzedRow<ProductCsvRow | ServiceCsvRow>;

type Props = {
  rows: Row[];
  /** The submitted cells, so an invalid row can still show what was typed. */
  rawRows: Record<string, string>[];
  type: ImportType;
  overrides: Set<number>;
  onToggleOverride: (index: number) => void;
};

const ITEMS_PER_PAGE = 20;

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function ImportReviewTable({
  rows,
  rawRows,
  type,
  overrides,
  onToggleOverride,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return rows.slice(start, start + ITEMS_PER_PAGE);
  }, [rows, currentPage]);

  const itemLabel = type === "products" ? "product" : "service";

  return (
    <div className="space-y-4">
      <div className="border-border overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="hidden md:table-cell">Categories</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow key={row.index}>
                <TableCell className="text-muted-foreground">
                  {row.index + 1}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row.status === "valid"
                        ? "default"
                        : row.status === "duplicate"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {(() => {
                    const name =
                      row.normalized?.name ??
                      rawRows[row.index]?.name?.trim() ??
                      "";
                    return name !== "" ? (
                      name
                    ) : (
                      <span className="text-muted-foreground font-normal">
                        (no name)
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  {row.normalized?.priceInCents != null
                    ? formatPrice(row.normalized.priceInCents)
                    : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-muted-foreground text-sm">
                    {row.normalized?.categories.length
                      ? row.normalized.categories.join(", ")
                      : "—"}
                  </span>
                </TableCell>
                <TableCell>
                  {row.status === "invalid" && (
                    <ul className="text-destructive list-disc space-y-0.5 pl-4 text-xs">
                      {row.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  )}
                  {row.status === "duplicate" && row.duplicate && (
                    <div className="space-y-1.5">
                      <p className="text-muted-foreground text-xs">
                        {row.duplicate.kind === "existing"
                          ? `Matches an existing ${itemLabel} with the same name`
                          : `Same name as row ${row.duplicate.row}`}
                      </p>
                      <label className="flex items-center gap-2 text-xs">
                        <Checkbox
                          checked={overrides.has(row.index)}
                          onCheckedChange={() => onToggleOverride(row.index)}
                        />
                        Create anyway
                      </label>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, rows.length)} of{" "}
            {rows.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
