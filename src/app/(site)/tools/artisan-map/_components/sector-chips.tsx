"use client";

import type { ShopSectorId } from "~/lib/constants/shop-sectors";
import { getShopSector, SHOP_SECTORS } from "~/lib/constants/shop-sectors";
import { cn } from "~/lib/utils";

import { nextSectors, visibleSectorIds } from "../_lib/sectors";
import { useMapTheme } from "./map-style";

// ---------------------------------------------------------------------------
// Dot / badge
// ---------------------------------------------------------------------------

/** The sector's pin colour as a small dot. Decorative: always pair a label. */
export function SectorDot({
  sector,
  muted = false,
  className,
}: {
  sector: ShopSectorId;
  /** Greyed out, for a chip that's switched off. */
  muted?: boolean;
  className?: string;
}) {
  const theme = useMapTheme();
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        muted && "opacity-40 grayscale",
        className,
      )}
      style={{ backgroundColor: getShopSector(sector).color[theme] }}
    />
  );
}

/** Sector label with its colour, for the shop card. */
export function SectorBadge({
  sector,
  className,
}: {
  sector: ShopSectorId;
  className?: string;
}) {
  const theme = useMapTheme();
  const { label, color } = getShopSector(sector);
  return (
    <span
      className={cn(
        "text-foreground inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${color[theme]} 12%, transparent)`,
        borderColor: `color-mix(in oklab, ${color[theme]} 45%, transparent)`,
      }}
    >
      <SectorDot sector={sector} />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Chips
// ---------------------------------------------------------------------------

type SectorChipsProps = {
  /** Selected sectors; `[]` means all. */
  selected: ShopSectorId[];
  onChange: (next: ShopSectorId[]) => void;
  /** Matches per sector under the other active filters. */
  counts: Map<ShopSectorId, number>;
  /** Shops per sector before any filter; sectors at 0 are hidden. */
  totals: Map<ShopSectorId, number>;
  /** "wrap" for the sidebar; "scroll" is one swipeable row (mobile). */
  layout?: "wrap" | "scroll";
  className?: string;
};

const chipClass =
  "focus-visible:ring-ring/50 focus-visible:border-ring inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px]";

/**
 * Sector filter that doubles as the pin colour legend. From "All", the first
 * click solos a sector; later clicks toggle (see `nextSectors`).
 */
export function SectorChips({
  selected,
  onChange,
  counts,
  totals,
  layout = "wrap",
  className,
}: SectorChipsProps) {
  const theme = useMapTheme();
  const isAll = selected.length === 0;

  // Sectors nobody is in yet would only be noise, unless the URL picked one.
  const visibleIds = visibleSectorIds(totals, selected);
  const visible = SHOP_SECTORS.filter((sector) =>
    visibleIds.includes(sector.id),
  );
  const allCount = visible.reduce(
    (sum, sector) => sum + (counts.get(sector.id) ?? 0),
    0,
  );

  if (visible.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Filter by sector"
      className={cn(
        "flex gap-1.5",
        layout === "wrap"
          ? "flex-wrap"
          : "-mx-2 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={isAll}
        aria-label={`All sectors, ${allCount} ${allCount === 1 ? "artisan" : "artisans"}`}
        onClick={() => onChange([])}
        className={cn(
          chipClass,
          isAll
            ? "border-foreground/30 bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-secondary/60 border-border",
        )}
      >
        All
        <span className="text-muted-foreground tabular-nums">{allCount}</span>
      </button>

      {visible.map((sector) => {
        const isOn = selected.includes(sector.id);
        const isOff = !isAll && !isOn;
        const color = sector.color[theme];
        const count = counts.get(sector.id) ?? 0;
        return (
          <button
            key={sector.id}
            type="button"
            aria-pressed={isOn}
            aria-label={`${sector.label}, ${count} ${count === 1 ? "artisan" : "artisans"}`}
            title={sector.label}
            onClick={() =>
              onChange(nextSectors(selected, sector.id, visibleIds))
            }
            className={cn(
              chipClass,
              isOn
                ? "text-foreground"
                : isOff
                  ? "text-muted-foreground border-border hover:bg-secondary/60"
                  : "text-foreground border-border hover:bg-secondary/60",
            )}
            style={
              isOn
                ? {
                    backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
                    borderColor: color,
                  }
                : undefined
            }
          >
            <SectorDot sector={sector.id} muted={isOff} />
            {sector.short}
            <span
              className={cn(
                "text-muted-foreground tabular-nums",
                count === 0 && "opacity-60",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
