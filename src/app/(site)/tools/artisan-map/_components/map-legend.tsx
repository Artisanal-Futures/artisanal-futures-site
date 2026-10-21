"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { Info, X } from "lucide-react";

import type { MapBrandColors } from "./map-style";
import { cn } from "~/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "artisan-map:legend-open";
/** Matches Tailwind's `md`; the legend starts open at and above this width. */
const DESKTOP_QUERY = "(min-width: 768px)";

// ---------------------------------------------------------------------------
// Swatches
// ---------------------------------------------------------------------------

/** The map pin, drawn with the same 30x40 geometry as `pin-image.ts`. */
function PinGlyph({
  colors,
  className,
}: {
  colors: MapBrandColors;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 30 40"
      className={cn("h-[22px] w-[16.5px] shrink-0", className)}
      aria-hidden
    >
      <path
        d="M15 37 L5.66 18.79 A10.5 10.5 0 1 1 24.34 18.79 Z"
        fill={colors.pin}
        stroke={colors.pinStroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle cx={15} cy={14} r={4} fill={colors.pinStroke} />
    </svg>
  );
}

/** Fixed 24x24 box so every row's label lines up. */
function Swatch({ children }: { children: ReactNode }) {
  return (
    <span
      className="relative grid size-6 shrink-0 place-items-center"
      aria-hidden
    >
      {children}
    </span>
  );
}

function LegendRow({
  swatch,
  children,
}: {
  swatch: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <Swatch>{swatch}</Swatch>
      <span className="text-foreground leading-snug">{children}</span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MapLegend({
  colors,
  showUserLocation = false,
  className,
}: {
  colors: MapBrandColors;
  /** Adds the "You" row once the viewer has used "Near me". */
  showUserLocation?: boolean;
  className?: string;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  // Read after mount so server and client markup agree. Small screens always
  // start collapsed (the card would cover the map); on desktop a saved choice
  // wins, otherwise it opens.
  useEffect(() => {
    let initial = false;
    try {
      if (window.matchMedia(DESKTOP_QUERY).matches) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        initial = saved !== "false";
      }
    } catch {
      // Storage blocked: fall back to the viewport default.
    }
    setOpen(initial);
  }, []);

  const toggle = (next: boolean) => {
    setOpen(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Not persisted; the legend still works for this visit.
    }
  };

  // On mobile, line up with the centred "List" button instead of the edge.
  const position = cn("absolute bottom-9 left-3 z-10 md:bottom-3", className);

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Map legend"
        title="Map legend"
        aria-expanded={false}
        aria-controls={panelId}
        onClick={() => toggle(true)}
        className={cn(
          position,
          "border-border bg-card text-foreground hover:bg-secondary focus-visible:ring-ring/50 focus-visible:border-ring flex size-[31px] items-center justify-center rounded-md border shadow-xs outline-none focus-visible:ring-[3px]",
        )}
      >
        <Info className="size-4" aria-hidden />
      </button>
    );
  }

  return (
    <section
      id={panelId}
      aria-label="Map legend"
      className={cn(
        position,
        // Expanded on mobile, sit above the "List" button rather than over it.
        "bottom-24",
        "bg-card/95 text-muted-foreground w-max max-w-[min(15rem,calc(100%-1.5rem))] rounded-lg border p-3 text-xs shadow-md backdrop-blur",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-foreground text-xs font-semibold">Legend</h2>
        <button
          type="button"
          aria-label="Close map legend"
          aria-expanded
          aria-controls={panelId}
          onClick={() => toggle(false)}
          className="text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring/50 -mr-1 flex size-5 items-center justify-center rounded-sm outline-none focus-visible:ring-[3px]"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>

      <ul className="space-y-1.5">
        <LegendRow swatch={<PinGlyph colors={colors} />}>
          Storefront (exact address)
        </LegendRow>

        <LegendRow
          swatch={
            <>
              {/* Mirrors the `areaRing` layer: faint fill, thin stroke. */}
              <span
                className="absolute inset-0 rounded-full border"
                style={{
                  backgroundColor: `color-mix(in oklab, ${colors.pin} 12%, transparent)`,
                  borderColor: `color-mix(in oklab, ${colors.pin} 40%, transparent)`,
                }}
              />
              <PinGlyph colors={colors} className="relative" />
            </>
          }
        >
          Approximate area (home-based)
        </LegendRow>

        <LegendRow
          swatch={
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
              <circle
                cx={12}
                cy={12}
                r={10}
                fill={colors.cluster}
                stroke={colors.clusterStroke}
                strokeWidth={2.5}
                strokeOpacity={0.95}
              />
              <text
                x={12}
                y={12}
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.clusterText}
                fontSize={9}
                fontWeight={700}
              >
                12
              </text>
            </svg>
          }
        >
          Group of artisans. Click to zoom.
        </LegendRow>

        <LegendRow
          swatch={
            <>
              <PinGlyph colors={colors} />
              <span
                className="absolute top-0 right-0 flex size-3.5 items-center justify-center rounded-full border-[1.5px] text-[8px] leading-none font-bold"
                style={{
                  backgroundColor: colors.cluster,
                  borderColor: colors.clusterStroke,
                  color: colors.clusterText,
                }}
              >
                3
              </span>
            </>
          }
        >
          Several shops at one storefront
        </LegendRow>

        {showUserLocation && (
          <LegendRow
            swatch={
              <span
                className="size-3.5 rounded-full border-2 border-white shadow-sm"
                style={{
                  backgroundColor: colors.userLocation,
                  boxShadow: `0 0 0 3px color-mix(in oklab, ${colors.userLocation} 25%, transparent)`,
                }}
              />
            }
          >
            You
          </LegendRow>
        )}
      </ul>
    </section>
  );
}
