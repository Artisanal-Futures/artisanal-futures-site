"use client";

import type { ImportType } from "~/lib/csv-import";
import type { RouterOutputs } from "~/trpc/react";
import { getColumns } from "~/lib/csv-import";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type Props = {
  type: ImportType;
  categories: RouterOutputs["category"]["getAll"];
};

export function ColumnGuide({ type, categories }: Props) {
  const columns = getColumns(type);
  const categoryType = type === "products" ? "PRODUCT" : "SERVICE";
  const matchingCategories = categories.filter((c) => c.type === categoryType);
  const itemLabel = type === "products" ? "product" : "service";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-foreground text-sm font-medium">
          Template columns
        </h3>
        <div className="border-border mt-2 overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Column</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="hidden sm:table-cell">Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns.map((column) => (
                <TableRow key={column.header}>
                  <TableCell className="align-top">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
                        {column.header}
                      </code>
                      {column.required && (
                        <Badge variant="outline" className="text-[10px]">
                          required
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground align-top text-sm">
                    {column.description}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden align-top text-sm sm:table-cell">
                    {column.examples[0]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h3 className="text-foreground text-sm font-medium">
          Valid {itemLabel} categories
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matchingCategories.length > 0 ? (
            matchingCategories.map((category) => (
              <Badge key={category.id} variant="outline">
                {category.name}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">None yet</span>
          )}
        </div>
      </div>

      <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
        <li>
          For columns with multiple values, separate each value with a{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">|</code>{" "}
          character.
        </li>
        <li>
          Save the file from Excel, Numbers or Google Sheets as{" "}
          <span className="font-medium">&quot;CSV UTF-8&quot;</span>. Excel may
          strip leading zeros from numeric-looking SKUs — format that column as
          text before saving if that matters to you.
        </li>
      </ul>
    </div>
  );
}
