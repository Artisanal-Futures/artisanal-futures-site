"use client";

import { useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Skeleton } from "~/components/ui/skeleton";

type UpdateSearchParams = (
  params: Record<string, string | number | null>,
) => void;

/**
 * Shared between the product and service results pages so the two stay in
 * step. Both category clients are otherwise near-identical; consolidating them
 * fully is a separate piece of work.
 */

/* -------------------------------------------------------------------------- */

/**
 * Removable pills for every active facet. Previously the only way to see what
 * was applied was to read the sidebar, and the only way to undo it was the
 * "Reset all" button, which cleared everything at once.
 */
export function ActiveFilterChips({
  updateSearchParams,
  resetFilters,
  stores,
}: {
  updateSearchParams: UpdateSearchParams;
  resetFilters: () => void;
  stores: { id: string; name: string }[] | undefined;
}) {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const store = searchParams.get("store") ?? "";
  const subcategory = searchParams.get("subcategory") ?? "";
  const attributes =
    searchParams.get("attributes")?.split(",").filter(Boolean) ?? [];

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (search) {
    chips.push({
      key: `search:${search}`,
      label: `“${search}”`,
      onRemove: () => updateSearchParams({ search: null }),
    });
  }

  if (store && store !== "all") {
    const storeName = stores?.find((s) => s.id === store)?.name ?? "Store";
    chips.push({
      key: `store:${store}`,
      label: storeName,
      onRemove: () => updateSearchParams({ store: "all" }),
    });
  }

  if (subcategory) {
    chips.push({
      key: `subcategory:${subcategory}`,
      label: decodeURIComponent(subcategory),
      onRemove: () => updateSearchParams({ subcategory: null }),
    });
  }

  for (const attribute of attributes) {
    chips.push({
      key: `attribute:${attribute}`,
      label: attribute,
      onRemove: () => {
        const remaining = attributes.filter((a) => a !== attribute);
        updateSearchParams({
          attributes: remaining.length > 0 ? remaining.join(",") : null,
        });
      },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">Filters:</span>
      {chips.map((chip) => (
        <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
          <span className="max-w-[16rem] truncate">{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove filter ${chip.label}`}
            className="hover:bg-background/60 rounded-full p-0.5"
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      {chips.length > 1 && (
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Clear all
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Shown when the strict pass found nothing and the forgiving pass had to step
 * in. Framed as close matches so results are never passed off as exact hits.
 */
export function FuzzyNotice({ query }: { query: string }) {
  return (
    <p className="bg-muted/50 text-muted-foreground rounded-md border px-4 py-3 text-sm">
      No exact matches for <span className="font-medium">“{query}”</span> —
      showing the closest results instead.
    </p>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Replaces the single unstyled "No products found for the selected filters."
 * line, which never said what was searched or offered a way out.
 */
export function NoResults({
  noun,
  query,
  hasFilters,
  suggestions,
  resetFilters,
  updateSearchParams,
}: {
  /** "products" or "services". */
  noun: string;
  query: string;
  hasFilters: boolean;
  suggestions: string[];
  resetFilters: () => void;
  updateSearchParams: UpdateSearchParams;
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>
          {query ? `No ${noun} match “${query}”` : `No ${noun} found`}
        </EmptyTitle>
        <EmptyDescription>
          {hasFilters
            ? "Try a different spelling, a broader term, or remove some filters."
            : `Try a different spelling or a broader term.`}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-muted-foreground text-sm">Try:</span>
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => updateSearchParams({ search: suggestion })}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
        {hasFilters && (
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}

/* -------------------------------------------------------------------------- */

/** Placeholder grid while a filter change is in flight. */
export function ResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
