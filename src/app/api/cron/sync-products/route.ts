import { NextResponse } from "next/server";

import { env } from "~/env";
import { db } from "~/server/db";
import { runScheduledSync } from "~/server/lib/product-sync";
import { checkRateLimit, getClientIp } from "~/server/lib/rate-limit";

import { authorizeCronRequest } from "./_lib";

/**
 * Weekly product-sync entry point.
 *
 *   POST /api/cron/sync-products
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Visits every shop with sync switched on, re-reads its storefront, and records
 * a review queue of proposed changes. It never writes to the product catalog —
 * an admin applies the changes from /admin/products/sync.
 *
 * Driven by a Coolify Scheduled Task on the app resource, so it only ever needs
 * to be reachable from inside the container:
 *
 *   curl -fsS --max-time 900 -X POST \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     http://localhost:3000/api/cron/sync-products
 *
 * Suggested schedule: `0 4 * * 1` (Mondays, 4am). AF runs as a single Coolify
 * instance (see the note in `~/server/lib/rate-limit`), so there is no
 * double-fire risk today; if it is ever scaled horizontally this needs a lock.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Shops are visited one at a time and small stores can be slow; give the whole
// sweep room rather than having it cut off partway through the shop list.
export const maxDuration = 900;

export async function POST(req: Request) {
  // Rate limit before auth so an unauthenticated flood can't spin up syncs.
  if (!checkRateLimit(getClientIp(req), { limit: 5, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!env.CRON_SECRET) {
    console.error(
      "[cron/sync-products] CRON_SECRET is not set — refusing to run. Set it in the Coolify dashboard.",
    );
    return NextResponse.json(
      { error: "Scheduled sync is not configured on this deployment." },
      { status: 503 },
    );
  }

  if (
    !authorizeCronRequest(req.headers.get("authorization"), env.CRON_SECRET)
  ) {
    // Never say which part failed.
    console.warn("[cron/sync-products] Rejected an unauthorized request.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const summary = await runScheduledSync(db);
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    console.log(
      `[cron/sync-products] Finished in ${seconds}s — ${summary.shopsPlanned} planned, ${summary.shopsSkipped} skipped, ${summary.shopsFailed} failed of ${summary.shopsConsidered} shops.`,
    );
    return NextResponse.json({ ok: true, durationSeconds: seconds, ...summary });
  } catch (err) {
    console.error("[cron/sync-products] Sweep failed:", err);
    return NextResponse.json(
      { ok: false, error: "Sync sweep failed. See server logs." },
      { status: 500 },
    );
  }
}
