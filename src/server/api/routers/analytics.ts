import { Prisma } from "generated/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { artisanProcedure, createTRPCRouter } from "~/server/api/trpc";

const DAY_MS = 24 * 60 * 60 * 1000;

type Target = "PRODUCT" | "SERVICE" | "WEBSITE";

/** UTC calendar day as YYYY-MM-DD, matching the SQL `to_char` below. */
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Analytics for a shop's owner. `artisanProcedure` supplies
 * `ctx.shopsAvailable` — every shop for an ADMIN, only owned shops for an
 * ARTISAN — so a shop outside that list is reported as missing.
 */
export const analyticsRouter = createTRPCRouter({
  getShopOutboundStats: artisanProcedure
    .input(
      z.object({
        shopId: z.string(),
        days: z.union([z.literal(7), z.literal(30), z.literal(90)]),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.shopsAvailable.some((shop) => shop.id === input.shopId)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shop not found." });
      }

      const { shopId, days } = input;
      const now = new Date();
      const start = new Date(now.getTime() - days * DAY_MS);
      const previousStart = new Date(start.getTime() - days * DAY_MS);

      const inPeriod = { shopId, createdAt: { gte: start, lte: now } };

      const [
        total,
        previousTotal,
        targetGroups,
        sourceGroups,
        dailyRows,
        productGroups,
        serviceGroups,
      ] = await Promise.all([
        ctx.db.outboundClick.count({ where: inPeriod }),
        ctx.db.outboundClick.count({
          where: { shopId, createdAt: { gte: previousStart, lt: start } },
        }),
        ctx.db.outboundClick.groupBy({
          by: ["target"],
          where: inPeriod,
          _count: { _all: true },
        }),
        ctx.db.outboundClick.groupBy({
          by: ["source"],
          where: inPeriod,
          _count: { _all: true },
          orderBy: { _count: { source: "desc" } },
        }),
        ctx.db.$queryRaw<{ day: string; count: number }[]>(Prisma.sql`
          SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
                 COUNT(*)::int AS count
          FROM "OutboundClick"
          WHERE "shopId" = ${shopId}
            AND "createdAt" >= ${start}
            AND "createdAt" <= ${now}
          GROUP BY 1
          ORDER BY 1
        `),
        ctx.db.outboundClick.groupBy({
          by: ["productId"],
          where: { ...inPeriod, productId: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { productId: "desc" } },
          take: 10,
        }),
        ctx.db.outboundClick.groupBy({
          by: ["serviceId"],
          where: { ...inPeriod, serviceId: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { serviceId: "desc" } },
          take: 10,
        }),
      ]);

      const byTarget: Record<Target, number> = {
        PRODUCT: 0,
        SERVICE: 0,
        WEBSITE: 0,
      };
      for (const group of targetGroups) {
        byTarget[group.target] = group._count._all;
      }

      const bySource = sourceGroups.map((group) => ({
        source: group.source,
        count: group._count._all,
      }));

      // Zero-fill every UTC day in the window so the chart has no gaps.
      const countsByDay = new Map(dailyRows.map((row) => [row.day, row.count]));
      const daily: { date: string; count: number }[] = [];
      const firstDay = Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate(),
      );
      for (let t = firstDay; t <= now.getTime(); t += DAY_MS) {
        const date = dayKey(new Date(t));
        daily.push({ date, count: countsByDay.get(date) ?? 0 });
      }

      const productIds = productGroups.flatMap((g) =>
        g.productId ? [g.productId] : [],
      );
      const serviceIds = serviceGroups.flatMap((g) =>
        g.serviceId ? [g.serviceId] : [],
      );
      const [products, services] = await Promise.all([
        ctx.db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        }),
        ctx.db.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        }),
      ]);
      const productNames = new Map(products.map((p) => [p.id, p.name]));
      const serviceNames = new Map(services.map((s) => [s.id, s.name]));

      const topItems = [
        ...productGroups.flatMap((g) =>
          g.productId
            ? [
                {
                  id: g.productId,
                  kind: "PRODUCT" as const,
                  name: productNames.get(g.productId) ?? "(deleted item)",
                  count: g._count._all,
                },
              ]
            : [],
        ),
        ...serviceGroups.flatMap((g) =>
          g.serviceId
            ? [
                {
                  id: g.serviceId,
                  kind: "SERVICE" as const,
                  name: serviceNames.get(g.serviceId) ?? "(deleted item)",
                  count: g._count._all,
                },
              ]
            : [],
        ),
      ]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return { total, previousTotal, byTarget, bySource, daily, topItems };
    }),
});
