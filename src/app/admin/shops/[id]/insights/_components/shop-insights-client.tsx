"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { MousePointerClick } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { ChartConfig } from "~/components/ui/chart";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

type Stats = RouterOutputs["analytics"]["getShopOutboundStats"];
type Days = 7 | 30 | 90;

const PERIODS: Days[] = [7, 30, 90];

const SOURCE_LABELS: Record<string, string> = {
  SHOP_PROFILE: "Shop page",
  SHOP_HERO: "Shop header",
  COLLECTIONS: "Collections",
  SHOP_CARD: "Shop directory",
  ARTISAN_MAP: "Artisan map",
};

const KIND_LABELS = { PRODUCT: "Product", SERVICE: "Service" } as const;

const chartConfig = {
  count: { label: "Clicks", color: "var(--chart-1)" },
} satisfies ChartConfig;

const numberFormat = new Intl.NumberFormat("en-US");

/** `YYYY-MM-DD` (a UTC day) as e.g. "Oct 3", without local-timezone drift. */
function formatDay(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatChange(total: number, previousTotal: number, days: Days) {
  if (previousTotal === 0) {
    return total > 0 ? "New" : `No clicks in the previous ${days} days`;
  }
  const percent = Math.round(((total - previousTotal) / previousTotal) * 100);
  if (percent === 0) return `No change vs previous ${days} days`;
  const sign = percent > 0 ? "+" : "−";
  return `${sign}${Math.abs(percent)}% vs previous ${days} days`;
}

export function ShopInsightsClient({ shopId }: { shopId: string }) {
  const [days, setDays] = useState<Days>(30);

  const { data, isLoading, isError, refetch } =
    api.analytics.getShopOutboundStats.useQuery(
      { shopId, days },
      { placeholderData: keepPreviousData },
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Outbound clicks</h2>
          <p className="text-muted-foreground text-sm">
            Visitors who left Artisanal Futures for your site from a Buy, Book
            or Visit button.
          </p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={String(days)}
          onValueChange={(value) => {
            // Radix emits "" when the active item is clicked again.
            if (value) setDays(Number(value) as Days);
          }}
          aria-label="Time period"
        >
          {PERIODS.map((period) => (
            <ToggleGroupItem
              key={period}
              value={String(period)}
              aria-label={`Last ${period} days`}
            >
              {period}d
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {isError ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            Couldn&apos;t load your stats.{" "}
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-foreground underline underline-offset-4"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
        <InsightsSkeleton />
      ) : (
        <InsightsContent stats={data} days={days} />
      )}
    </div>
  );
}

function InsightsContent({ stats, days }: { stats: Stats; days: Days }) {
  if (stats.total === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
            <MousePointerClick className="size-5" />
          </div>
          <p className="text-muted-foreground max-w-sm text-sm">
            No clicks yet. Clicks on your Buy, Book and Visit buttons will show
            up here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const change = formatChange(stats.total, stats.previousTotal, days);
  const trend =
    stats.previousTotal === 0
      ? "neutral"
      : stats.total > stats.previousTotal
        ? "up"
        : stats.total < stats.previousTotal
          ? "down"
          : "neutral";

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total clicks"
          value={stats.total}
          className="col-span-2 lg:col-span-1"
          note={change}
          noteClassName={
            trend === "up"
              ? "text-primary"
              : trend === "down"
                ? "text-destructive"
                : undefined
          }
        />
        <StatCard label="Product clicks" value={stats.byTarget.PRODUCT} />
        <StatCard label="Service clicks" value={stats.byTarget.SERVICE} />
        <StatCard label="Website clicks" value={stats.byTarget.WEBSITE} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Clicks per day</CardTitle>
          <CardDescription>Last {days} days, in UTC.</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-56 w-full sm:h-64"
          >
            <AreaChart
              data={stats.daily}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fill-clicks" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatDay}
              />
              <YAxis
                width={32}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(value) => formatDay(String(value))}
                  />
                }
              />
              <Area
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2}
                fill="url(#fill-clicks)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Top items</CardTitle>
            <CardDescription>
              Products and services visitors clicked through most.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Only website clicks so far, so there are no individual items to
                rank.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topItems.map((item) => (
                    <TableRow key={`${item.kind}-${item.id}`}>
                      <TableCell className="max-w-64 truncate font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {KIND_LABELS[item.kind]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(item.count)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">By source</CardTitle>
            <CardDescription>Where visitors clicked from.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-border divide-y">
              {stats.bySource.map(({ source, count }) => (
                <li
                  key={source}
                  className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
                >
                  <span>{SOURCE_LABELS[source] ?? source}</span>
                  <span className="font-medium tabular-nums">
                    {numberFormat.format(count)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  note,
  noteClassName,
  className,
}: {
  label: string;
  value: number;
  note?: string;
  noteClassName?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="space-y-1">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">
          {numberFormat.format(value)}
        </p>
        {note && (
          <p className={`text-muted-foreground text-xs ${noteClassName ?? ""}`}>
            {note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Skeleton className="bg-muted col-span-2 h-28 rounded-xl lg:col-span-1" />
        <Skeleton className="bg-muted h-28 rounded-xl" />
        <Skeleton className="bg-muted h-28 rounded-xl" />
        <Skeleton className="bg-muted h-28 rounded-xl" />
      </div>
      <Skeleton className="bg-muted h-80 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Skeleton className="bg-muted h-64 rounded-xl" />
        <Skeleton className="bg-muted h-64 rounded-xl" />
      </div>
    </div>
  );
}
