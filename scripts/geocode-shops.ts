/**
 * Backfill map coordinates for every shop address.
 *
 * Usage:
 *
 *   pnpm geocode-shops            # geocode addresses whose query changed
 *   pnpm geocode-shops --force    # re-geocode every address
 *
 * Uses the same `syncShopCoordinates` as the shop router, so street fields
 * only reach the geocoder for STOREFRONT shops; everything else sends zip,
 * city, state and country only. Rows geocoded before the `mode=` prefix was
 * added to `geocodeQuery` re-geocode once on their first run.
 *
 * Rate limiting: Nominatim allows at most 1 request/second. The geocoding
 * module throttles every request it makes (including the street → zip →
 * city/state fallbacks, up to three requests for one shop), so this loop can run
 * shops back to back without its own sleep. Addresses whose stored
 * `geocodeQuery` already matches are skipped without touching the network.
 */

import { PrismaClient } from "../generated/prisma";
import {
  syncShopCoordinates,
  type SyncShopCoordinatesResult,
} from "../src/server/geocoding/geocode-shop-address";

const force = process.argv.slice(2).includes("--force");

async function main() {
  const db = new PrismaClient();

  try {
    const addresses = await db.shopAddress.findMany({
      where: { shopId: { not: null } },
      select: { shopId: true },
      orderBy: { shopId: "asc" },
    });

    const shopIds = addresses
      .map((address) => address.shopId)
      .filter((shopId): shopId is string => !!shopId);

    console.log(
      `Geocoding ${shopIds.length} shop address(es)${force ? " (--force)" : ""}…\n`,
    );

    const counts: Partial<Record<SyncShopCoordinatesResult | "error", number>> =
      {};

    for (const [index, shopId] of shopIds.entries()) {
      let result: SyncShopCoordinatesResult | "error";
      try {
        result = await syncShopCoordinates(db, shopId, { force });
      } catch (error) {
        console.error(`  ${shopId}: error`, error);
        result = "error";
      }
      counts[result] = (counts[result] ?? 0) + 1;
      console.log(`[${index + 1}/${shopIds.length}] ${shopId}: ${result}`);
    }

    console.log("\nSummary:");
    for (const [result, count] of Object.entries(counts)) {
      console.log(`  ${result.padEnd(10)} ${count}`);
    }
  } finally {
    await db.$disconnect();
  }
}

void main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
