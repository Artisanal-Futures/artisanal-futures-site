"use client";

import { useMemo } from "react";
import { BarChart3, Info, Share2 } from "lucide-react";
import { toast } from "sonner";

import type { MapStats } from "../_lib/map-stats";
import type { ShopSectorId } from "~/lib/constants/shop-sectors";
import { getShopSector, isShopSector } from "~/lib/constants/shop-sectors";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { BreakdownChart, toBreakdownRows } from "./attribute-breakdown-chart";
import { useMapTheme } from "./map-style";

type MapStatsBarProps = {
  stats: MapStats;
  sectorCounts: Map<ShopSectorId, number>;
  selectedSectors: ShopSectorId[];
  /** Picking a sector bar behaves like clicking its chip. */
  onPickSector: (sector: ShopSectorId) => void;
  attributeCounts: Map<string, number>;
  selectedAttributes: string[];
  onToggleAttribute: (attribute: string, checked: boolean) => void;
  /**
   * The link "Share this view" copies: camera, filters and selection. A
   * function so the caller can first flush a pending (debounced) URL write.
   */
  getShareUrl: () => string;
  /** Opens the "About & data" panel. */
  onOpenAbout: () => void;
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
  sectorCounts,
  selectedSectors,
  onPickSector,
  attributeCounts,
  selectedAttributes,
  onToggleAttribute,
  getShareUrl,
  onOpenAbout,
  className,
}: MapStatsBarProps) {
  const theme = useMapTheme();

  const shareView = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast.success("Link to this view copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const sectorRows = useMemo(
    () =>
      toBreakdownRows(sectorCounts, selectedSectors, (id) => {
        const sector = getShopSector(id);
        return { name: sector.label, color: sector.color[theme] };
      }),
    [sectorCounts, selectedSectors, theme],
  );
  const attributeRows = useMemo(
    () => toBreakdownRows(attributeCounts, selectedAttributes),
    [attributeCounts, selectedAttributes],
  );

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

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        aria-label="About this map and data download"
        title="About this map and its data"
        onClick={onOpenAbout}
      >
        <Info aria-hidden="true" />
        <span className="hidden sm:inline">About &amp; data</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        aria-label="Share this view (copies a link)"
        title="Copy a link to this map view"
        onClick={() => void shareView()}
      >
        <Share2 aria-hidden="true" />
        <span className="hidden sm:inline">Share view</span>
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            aria-label="Sector and attribute breakdown"
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
            <h2 className="text-sm leading-none font-semibold">Breakdown</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Tap a bar to filter
            </p>
          </div>
          <Tabs defaultValue="sectors">
            <TabsList className="w-full">
              <TabsTrigger value="sectors">Sectors</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
            </TabsList>
            <TabsContent
              value="sectors"
              className="max-h-[60vh] overflow-y-auto"
            >
              <BreakdownChart
                rows={sectorRows}
                onPick={(id) => {
                  if (isShopSector(id)) onPickSector(id);
                }}
                label="Filter by sector"
                emptyLabel="No sectors in this view"
              />
            </TabsContent>
            <TabsContent
              value="attributes"
              className="max-h-[60vh] overflow-y-auto"
            >
              <BreakdownChart
                rows={attributeRows}
                onPick={(id) =>
                  onToggleAttribute(id, !selectedAttributes.includes(id))
                }
                label="Filter by artisan attribute"
                emptyLabel="No attributes in this view"
              />
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </section>
  );
}
