import Link from "next/link";
import { ExternalLink } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { shopPath } from "~/lib/seo/paths";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type Rows = RouterOutputs["shop"]["getSeoHealth"];

/** Score colour: thin profiles stand out. */
function scoreClass(score: number, total: number) {
  const ratio = score / total;
  if (ratio >= 0.8) return "text-green-700 dark:text-green-400";
  if (ratio >= 0.5) return "text-amber-700 dark:text-amber-400";
  return "text-destructive";
}

/**
 * Every shop scored on what search and answer engines read from a profile,
 * worst first: the to-do list for making shops findable.
 */
export function ShopSeoHealth({ rows }: { rows: Rows }) {
  const complete = rows.filter((row) => row.score === row.total).length;

  return (
    <>
      <p className="text-muted-foreground mb-4 text-sm">
        {complete} of {rows.length} shops have complete profiles. Each shop is
        checked for a description of at least 80 characters, a bio, logo, cover
        photo, city and state, website, a social link, at least one public
        product or service, and that it is public and indexable.
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop</TableHead>
              <TableHead className="w-20">Score</TableHead>
              <TableHead>Missing</TableHead>
              <TableHead className="w-32 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-8 text-center"
                >
                  No shops yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {shopPath(row)}
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    "font-medium tabular-nums",
                    scoreClass(row.score, row.total),
                  )}
                >
                  {row.score}/{row.total}
                </TableCell>
                <TableCell>
                  {row.missing.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {row.missing.map((label) => (
                        <Badge key={label} variant="outline">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Complete
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {row.isPublic && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link
                          href={shopPath(row)}
                          target="_blank"
                          aria-label={`View ${row.name}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/shops/${row.id}`}>Edit</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
