import { $Enums } from "generated/prisma";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import {
  adminOnlyProcedure,
  artisanProcedure,
  createTRPCRouter,
} from "~/server/api/trpc";
import {
  assertStaticallyPublicHttpUrl,
  SafeFetchError,
} from "~/server/lib/safe-fetch";
import {
  applySyncRun,
  planShopSync,
  runScheduledSync,
  SyncAlreadyPendingError,
  SyncNotConfiguredError,
  type DiffEntry,
  type SyncedPayload,
} from "~/server/lib/product-sync";

/**
 * API for the product sync review queue.
 *
 * Access model: `artisanProcedure` supplies `ctx.shopsAvailable` — every shop
 * for an ADMIN, only owned shops for an ARTISAN. Every query and mutation here
 * is scoped through `assertShopAccess`/`shopScope` built from that list, so an
 * artisan sees and acts on their own catalog and nothing else. Artisans may
 * apply their own runs: it is their catalog, and the destructive case (hiding a
 * product) is reversible by design.
 *
 * Two things stay `adminOnlyProcedure`: the sitewide sweep, and the
 * `allowInsecureOrigin` flag (a security decision about reaching a store over
 * plaintext, not a shop preference).
 */

/** Minimum gap between manual syncs of the same shop. */
export const MANUAL_SYNC_COOLDOWN_MS = 15 * 60 * 1000;

const RUN_LIST_SELECT = {
  id: true,
  shopId: true,
  platform: true,
  status: true,
  startedAt: true,
  finishedAt: true,
  reviewedAt: true,
  fetchedCount: true,
  errorMessage: true,
  insecureTLSCode: true,
  triggeredManually: true,
  shop: { select: { id: true, name: true, website: true } },
} as const;

type Ctx = { shopsAvailable: { id: string }[] };

/** Shop ids the caller may act on. */
function allowedShopIds(ctx: Ctx): string[] {
  return ctx.shopsAvailable.map((shop) => shop.id);
}

/** `where` fragment restricting a query to the caller's shops. */
function shopScope(ctx: Ctx) {
  return { shopId: { in: allowedShopIds(ctx) } };
}

/**
 * The artisan-writable feed URL.
 *
 * `syncUrl` is the one field on this router that ends up being handed to the
 * outbound fetcher, so it is validated the moment it is saved rather than at
 * fetch time: a syntactically valid http(s) URL, and one that clears the same
 * static checks `safeFetchText` applies (no credentials, standard ports only,
 * and no IP literal pointing at a private/reserved address). DNS is *not*
 * consulted here — a store can be temporarily unresolvable without its settings
 * becoming unsaveable — the fetch layer still resolves and re-checks every time.
 *
 * Empty string means "no override", and is stored as null.
 */
const syncUrlInput = z
  .string()
  .trim()
  .nullable()
  .transform((value) => (value && value.length > 0 ? value : null))
  .superRefine((value, ctx) => {
    if (value === null) return;

    if (!z.string().url().safeParse(value).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Enter a full URL including https:// — for example https://yourstore.com/products.json",
      });
      return;
    }

    try {
      const url = assertStaticallyPublicHttpUrl(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Only http:// and https:// URLs can be synced.",
        });
      }
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          err instanceof SafeFetchError
            ? `That URL can't be synced: ${err.message}`
            : "That URL can't be synced.",
      });
    }
  });

function assertShopAccess(ctx: Ctx, shopId: string) {
  if (!allowedShopIds(ctx).includes(shopId)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "That shop does not belong to you.",
    });
  }
}

export const productSyncRouter = createTRPCRouter({
  /** Runs the caller can see, pending ones first. */
  listRuns: artisanProcedure
    .input(
      z
        .object({
          shopId: z.string().optional(),
          limit: z.number().int().min(1).max(200).default(50),
        })
        .default({ limit: 50 }),
    )
    .query(async ({ ctx, input }) => {
      if (input.shopId) assertShopAccess(ctx, input.shopId);

      const runs = await ctx.db.productSyncRun.findMany({
        where: input.shopId ? { shopId: input.shopId } : shopScope(ctx),
        select: RUN_LIST_SELECT,
        orderBy: [{ startedAt: "desc" }],
        take: input.limit,
      });

      // Counts per change type, in one grouped query rather than N per run.
      const grouped = await ctx.db.productSyncProposal.groupBy({
        by: ["runId", "changeType"],
        where: { runId: { in: runs.map((r) => r.id) } },
        _count: { _all: true },
      });

      const countsByRun = new Map<
        string,
        { created: number; updated: number; missing: number }
      >();
      for (const row of grouped) {
        const entry = countsByRun.get(row.runId) ?? {
          created: 0,
          updated: 0,
          missing: 0,
        };
        if (row.changeType === $Enums.SyncChangeType.CREATE)
          entry.created = row._count._all;
        if (row.changeType === $Enums.SyncChangeType.UPDATE)
          entry.updated = row._count._all;
        if (row.changeType === $Enums.SyncChangeType.MISSING)
          entry.missing = row._count._all;
        countsByRun.set(row.runId, entry);
      }

      const isPending = (s: $Enums.SyncRunStatus) =>
        s === $Enums.SyncRunStatus.PENDING_REVIEW;

      return runs
        .map((run) => ({
          ...run,
          counts: countsByRun.get(run.id) ?? {
            created: 0,
            updated: 0,
            missing: 0,
          },
        }))
        .sort((a, b) => {
          if (isPending(a.status) !== isPending(b.status)) {
            return isPending(a.status) ? -1 : 1;
          }
          return b.startedAt.getTime() - a.startedAt.getTime();
        });
    }),

  /** Badge count for the sidebar — scoped, so artisans see only their own. */
  pendingCount: artisanProcedure.query(({ ctx }) =>
    ctx.db.productSyncRun.count({
      where: { ...shopScope(ctx), status: $Enums.SyncRunStatus.PENDING_REVIEW },
    }),
  ),

  /** A single run with every proposal and its field-level diff. */
  getRun: artisanProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const run = await ctx.db.productSyncRun.findUnique({
        where: { id: input.runId },
        select: {
          ...RUN_LIST_SELECT,
          proposals: {
            select: {
              id: true,
              productId: true,
              shopProductId: true,
              changeType: true,
              status: true,
              matchedBy: true,
              payload: true,
              diff: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  isPublic: true,
                  categories: { select: { id: true, name: true } },
                  tags: true,
                },
              },
            },
            orderBy: [{ changeType: "asc" }, { shopProductId: "asc" }],
          },
        },
      });

      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sync run not found." });
      }
      assertShopAccess(ctx, run.shopId);

      return {
        ...run,
        proposals: run.proposals.map((proposal) => ({
          ...proposal,
          payload: proposal.payload as unknown as SyncedPayload,
          diff: proposal.diff as unknown as DiffEntry[],
        })),
      };
    }),

  /** Kick off a sync for one shop right now, outside the weekly schedule. */
  runNow: artisanProcedure
    .input(z.object({ shopId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      assertShopAccess(ctx, input.shopId);

      // Cooldown: manual syncs hit the artisan's own storefront, and repeat
      // clicks on a slow store are how you get rate-limited by their host.
      const lastManual = await ctx.db.productSyncRun.findFirst({
        where: { shopId: input.shopId, triggeredManually: true },
        orderBy: { startedAt: "desc" },
        select: { startedAt: true },
      });
      if (lastManual) {
        const elapsed = Date.now() - lastManual.startedAt.getTime();
        if (elapsed < MANUAL_SYNC_COOLDOWN_MS) {
          const minutes = Math.ceil(
            (MANUAL_SYNC_COOLDOWN_MS - elapsed) / 60_000,
          );
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `This shop was synced recently. Try again in ${minutes} minute${
              minutes === 1 ? "" : "s"
            }.`,
          });
        }
      }

      try {
        return await planShopSync(ctx.db, input.shopId, {
          triggeredManually: true,
        });
      } catch (err) {
        if (
          err instanceof SyncNotConfiguredError ||
          err instanceof SyncAlreadyPendingError
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message: err.message });
        }
        throw err;
      }
    }),

  /**
   * Sync every configured shop at once. Admin-only — this reaches out to every
   * artisan's storefront, which is not one shop owner's call to make.
   *
   * Reuses the exact sweep the weekly cron runs, so "sync all now" and the
   * scheduled job can never drift apart.
   */
  syncAllNow: adminOnlyProcedure.mutation(({ ctx }) =>
    runScheduledSync(ctx.db, { triggeredManually: true }),
  ),

  /**
   * Commit the selected proposals. Everything else in the run is rejected, so
   * a run is always fully resolved and can never be half-applied.
   */
  applyRun: artisanProcedure
    .input(
      z.object({
        runId: z.string().min(1),
        approvedProposalIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.db.productSyncRun.findUnique({
        where: { id: input.runId },
        select: { shopId: true, status: true },
      });
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sync run not found." });
      }
      assertShopAccess(ctx, run.shopId);

      // The one failure worth naming: someone applied or discarded this run in
      // another tab. Everything else is an internal fault (a constraint
      // violation, a dead connection) whose text would leak schema details to
      // the browser, so it is logged here and reported generically.
      if (run.status !== $Enums.SyncRunStatus.PENDING_REVIEW) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This run is ${run.status.toLowerCase()}, not awaiting review.`,
        });
      }

      try {
        return await applySyncRun(
          ctx.db,
          input.runId,
          input.approvedProposalIds,
          ctx.session.user.id,
        );
      } catch (err) {
        console.error(
          `[product-sync] Applying run ${input.runId} failed:`,
          err,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Applying this run failed — nothing was changed. Check server logs.",
        });
      }
    }),

  /** Throw a run away without applying any of it. */
  discardRun: artisanProcedure
    .input(z.object({ runId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const run = await ctx.db.productSyncRun.findUnique({
        where: { id: input.runId },
        select: { status: true, shopId: true },
      });
      if (!run) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sync run not found." });
      }
      assertShopAccess(ctx, run.shopId);

      if (run.status !== $Enums.SyncRunStatus.PENDING_REVIEW) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This run is ${run.status.toLowerCase()}, not awaiting review.`,
        });
      }

      await ctx.db.$transaction([
        ctx.db.productSyncProposal.updateMany({
          where: { runId: input.runId },
          data: { status: $Enums.ProposalStatus.REJECTED },
        }),
        ctx.db.productSyncRun.update({
          where: { id: input.runId },
          data: {
            status: $Enums.SyncRunStatus.DISCARDED,
            reviewedAt: new Date(),
            reviewedById: ctx.session.user.id,
          },
        }),
      ]);

      return { message: "Sync run discarded." };
    }),

  /** The caller's shops with their sync configuration. */
  listShopConfigs: artisanProcedure.query(({ ctx }) =>
    ctx.db.shop.findMany({
      where: { id: { in: allowedShopIds(ctx) } },
      select: {
        id: true,
        name: true,
        website: true,
        syncPlatform: true,
        syncEnabled: true,
        syncUrl: true,
        allowInsecureOrigin: true,
        lastSyncedAt: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    }),
  ),

  /**
   * Update one shop's sync configuration.
   *
   * Artisans set their own platform, feed URL and on/off switch — the
   * Squarespace case in particular needs the shop owner to point at their own
   * products page. `allowInsecureOrigin` is ignored unless the caller is an
   * admin, so an artisan can't downgrade their own store to plaintext.
   */
  updateShopConfig: artisanProcedure
    .input(
      z.object({
        shopId: z.string().min(1),
        syncPlatform: z
          .enum([
            "MANUAL",
            "WORDPRESS",
            "SHOPIFY",
            "SQUARESPACE",
            "SIMPLEPRESS",
            "SQUARE",
          ])
          .nullable(),
        syncEnabled: z.boolean(),
        syncUrl: syncUrlInput,
        allowInsecureOrigin: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertShopAccess(ctx, input.shopId);
      const isAdmin = ctx.session.user.role === "ADMIN";

      await ctx.db.shop.update({
        where: { id: input.shopId },
        data: {
          syncPlatform: input.syncPlatform,
          syncEnabled: input.syncEnabled,
          // Already normalized to null-or-valid-URL by `syncUrlInput`.
          syncUrl: input.syncUrl,
          ...(isAdmin && input.allowInsecureOrigin !== undefined
            ? { allowInsecureOrigin: input.allowInsecureOrigin }
            : {}),
        },
      });
      return { message: "Sync settings saved." };
    }),
});
