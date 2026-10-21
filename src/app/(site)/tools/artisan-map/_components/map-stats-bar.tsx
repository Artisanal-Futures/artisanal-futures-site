"use client";

import { BarChart3 } from "lucide-react";

import type { MapStats } from "../_lib/map-stats";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

import { AttributeBreakdownChart } from "./attribute-breakdown-chart";

type MapStatsBarProps = {
  stats: MapStats;
  attributeCounts: Map<string, number>;
  selectedAttributes: string[];
  onToggleAttribute: (attribute: string, checked: boolean) => void;
  className?: string;
};

type Tile = {
  key: Extract<keyof MapStats, string>;
  singular: string;
  plural: string;
};

const TILES: Tile[] = [
  { key: "artisans", singular: "Artisan", plural: "Artisans" },
  { key: "cities", singular: "City", plural: "Cities" },
  { key: "storefronts", singular: "Storefront", plural: "Storefronts" },
  { key: "products", singular: "Product", plural: "Products" },
  { key: "services", singular: "Service", plural: "Services" },
];

export function MapStatsBar({
  stats,
  attributeCounts,
  selectedAttributes,
  onToggleAttribute,
  className,
}: MapStatsBarProps) {
  return (
    <section
      aria-label="Map summary"
      className={cn(
        "bg-background flex items-center gap-3 border-b px-4 py-2 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div
        aria-live="polite"
        className="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TILES.map((tile, i) => {
          const value = stats[tile.key];
          return (
            <div
              key={tile.key}
              className={cn(
                "flex shrink-0 items-baseline gap-1.5 pr-3 whitespace-nowrap sm:pr-5",
                i > 0 && "border-border border-l pl-3 sm:pl-5",
              )}
            >
              <span className="text-foreground text-base font-semibold tabular-nums">
                {value.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-xs">
                {value === 1 ? tile.singular : tile.plural}
              </span>
            </div>
          );
        })}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            aria-label="Attribute breakdown"
          >
            <BarChart3 aria-hidden="true" />
            <span className="hidden sm:inline">Breakdown</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          tabIndex={-1}
          // Focus the panel, not the chart's first keyboard button: that list
          // only becomes visible while focused, so auto-focus would reveal it.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement | null)?.focus();
          }}
          className="w-80 max-w-[calc(100vw-2rem)] outline-none"
        >
          <div className="mb-3">
            <h2 className="text-sm leading-none font-semibold">
              Artisan attributes
            </h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Tap a bar to filter
            </p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            <AttributeBreakdownChart
              counts={attributeCounts}
              selected={selectedAttributes}
              onToggle={onToggleAttribute}
            />
          </div>
        </PopoverContent>
      </Popover>
    </section>
  );
}
