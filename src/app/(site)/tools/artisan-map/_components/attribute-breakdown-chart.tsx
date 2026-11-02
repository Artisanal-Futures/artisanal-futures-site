"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import type { ChartConfig } from "~/components/ui/chart";
import { cn } from "~/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

import { MAP_BRAND_COLORS, useMapTheme } from "./map-style";

const ROW_HEIGHT = 28;
const MAX_LABEL_CHARS = 22;
const CHAR_WIDTH = 6.4; // approx. px per char at text-xs

const chartConfig = {
  count: { label: "Artisans" },
} satisfies ChartConfig;

/** One bar. `color` overrides the accent fill (e.g. a sector's pin colour). */
export type BreakdownRow = {
  id: string;
  name: string;
  count: number;
  selected: boolean;
  color?: string;
};

type BreakdownChartProps = {
  rows: BreakdownRow[];
  /** Called with a row's `id` when its bar, label or button is picked. */
  onPick: (id: string) => void;
  /** Names the keyboard list, e.g. "Filter by sector". */
  label: string;
  /** Shown when no row has a count. */
  emptyLabel: string;
};

/**
 * Rows for every key with a count, plus selected keys at 0 (so they can be
 * un-picked), most common first.
 */
export function toBreakdownRows<K extends string>(
  counts: Map<K, number>,
  selected: readonly K[],
  describe: (id: K) => { name: string; color?: string } = (id) => ({
    name: id,
  }),
): BreakdownRow[] {
  const ids = new Set<K>();
  for (const [id, count] of counts) {
    if (count > 0) ids.add(id);
  }
  for (const id of selected) ids.add(id);

  return [...ids]
    .map((id) => ({
      id,
      ...describe(id),
      count: counts.get(id) ?? 0,
      selected: selected.includes(id),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function truncate(name: string) {
  return name.length > MAX_LABEL_CHARS
    ? `${name.slice(0, MAX_LABEL_CHARS - 1)}…`
    : name;
}

type TickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
  rowsByName: Map<string, BreakdownRow>;
  onPick: (id: string) => void;
};

function BreakdownTick({
  x = 0,
  y = 0,
  payload,
  rowsByName,
  onPick,
}: TickProps) {
  if (!payload) return null;
  const name = payload.value;
  const row = rowsByName.get(name);
  const isSelected = row?.selected ?? false;
  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={() => row && onPick(row.id)}
      style={{ cursor: "pointer" }}
    >
      <title>{name}</title>
      <text
        x={-6}
        y={0}
        dy={4}
        textAnchor="end"
        className={cn(
          "text-xs",
          isSelected
            ? "fill-foreground font-semibold"
            : "fill-muted-foreground",
        )}
      >
        {truncate(name)}
      </text>
    </g>
  );
}

export function BreakdownChart({
  rows,
  onPick,
  label,
  emptyLabel,
}: BreakdownChartProps) {
  const theme = useMapTheme();
  const colors = MAP_BRAND_COLORS[theme];

  const rowsByName = useMemo(
    () => new Map(rows.map((row) => [row.name, row])),
    [rows],
  );
  const anySelected = rows.some((row) => row.selected);

  if (rows.length === 0 || rows.every((r) => r.count === 0 && !r.selected)) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        {emptyLabel}
      </p>
    );
  }

  /** Accent bars go terracotta when picked; coloured bars dim when not. */
  const fillFor = (row: BreakdownRow) =>
    row.color ?? (row.selected ? colors.accentActive : colors.accent);
  const opacityFor = (row: BreakdownRow) =>
    row.color && anySelected && !row.selected ? 0.35 : 1;

  const longest = Math.min(
    MAX_LABEL_CHARS,
    Math.max(...rows.map((r) => r.name.length)),
  );
  const yAxisWidth = Math.ceil(longest * CHAR_WIDTH) + 12;

  return (
    <div>
      <div aria-hidden="true">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto w-full"
          style={{ height: rows.length * ROW_HEIGHT + 8 }}
        >
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 28, bottom: 4, left: 0 }}
            barCategoryGap={6}
          >
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={<BreakdownTick rowsByName={rowsByName} onPick={onPick} />}
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.5 }}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_, payload) =>
                    (payload[0]?.payload as BreakdownRow | undefined)?.name
                  }
                />
              }
            />
            <Bar
              dataKey="count"
              radius={4}
              maxBarSize={14}
              onClick={(row: BreakdownRow) => onPick(row.id)}
            >
              {rows.map((row) => (
                <Cell
                  key={row.id}
                  fill={fillFor(row)}
                  fillOpacity={opacityFor(row)}
                  style={{ cursor: "pointer" }}
                />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                offset={6}
                className="fill-muted-foreground text-xs tabular-nums"
                formatter={(v: number) => v.toLocaleString()}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Keyboard / screen-reader path; revealed visually while focused. */}
      <ul
        aria-label={label}
        className="sr-only focus-within:not-sr-only focus-within:mt-2 focus-within:flex focus-within:flex-wrap focus-within:gap-1"
      >
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              aria-pressed={row.selected}
              onClick={() => onPick(row.id)}
              className="border-input bg-background focus-visible:ring-ring/50 rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-hidden aria-pressed:font-semibold"
            >
              {row.name} ({row.count.toLocaleString()})
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
