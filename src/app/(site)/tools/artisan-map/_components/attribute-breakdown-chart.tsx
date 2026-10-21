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

type Row = { name: string; count: number; selected: boolean };

type AttributeBreakdownChartProps = {
  counts: Map<string, number>;
  selected: string[];
  onToggle: (attribute: string, checked: boolean) => void;
};

function truncate(name: string) {
  return name.length > MAX_LABEL_CHARS
    ? `${name.slice(0, MAX_LABEL_CHARS - 1)}…`
    : name;
}

type TickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
  selectedSet: Set<string>;
  onPick: (name: string) => void;
};

function AttributeTick({
  x = 0,
  y = 0,
  payload,
  selectedSet,
  onPick,
}: TickProps) {
  if (!payload) return null;
  const name = payload.value;
  const isSelected = selectedSet.has(name);
  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={() => onPick(name)}
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

export function AttributeBreakdownChart({
  counts,
  selected,
  onToggle,
}: AttributeBreakdownChartProps) {
  const theme = useMapTheme();
  const colors = MAP_BRAND_COLORS[theme];

  const rows = useMemo<Row[]>(() => {
    const selectedSet = new Set(selected);
    const names = new Set<string>();
    for (const [name, count] of counts) {
      if (count > 0) names.add(name);
    }
    // Keep selected attributes visible (even at 0) so they can be un-toggled.
    for (const name of selected) names.add(name);

    return [...names]
      .map((name) => ({
        name,
        count: counts.get(name) ?? 0,
        selected: selectedSet.has(name),
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [counts, selected]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  if (rows.length === 0 || rows.every((r) => r.count === 0 && !r.selected)) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">
        No attributes in this view
      </p>
    );
  }

  const handlePick = (name: string) => onToggle(name, !selectedSet.has(name));

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
              tick={
                <AttributeTick selectedSet={selectedSet} onPick={handlePick} />
              }
            />
            <ChartTooltip
              cursor={{ fillOpacity: 0.5 }}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_, payload) =>
                    (payload[0]?.payload as Row | undefined)?.name
                  }
                />
              }
            />
            <Bar
              dataKey="count"
              radius={4}
              maxBarSize={14}
              onClick={(row: Row) => handlePick(row.name)}
            >
              {rows.map((row) => (
                <Cell
                  key={row.name}
                  fill={row.selected ? colors.pinSelected : colors.pin}
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
        aria-label="Filter by artisan attribute"
        className="sr-only focus-within:not-sr-only focus-within:mt-2 focus-within:flex focus-within:flex-wrap focus-within:gap-1"
      >
        {rows.map((row) => (
          <li key={row.name}>
            <button
              type="button"
              aria-pressed={row.selected}
              onClick={() => handlePick(row.name)}
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
