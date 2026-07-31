"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

import { SyncStatusBadge } from "./sync-status-badge";

type Runs = RouterOutputs["productSync"]["listRuns"];
type ShopConfigs = RouterOutputs["productSync"]["listShopConfigs"];

/** Platforms with a public feed we can actually fetch. */
const SYNCABLE_PLATFORMS = [
  { value: "SHOPIFY", label: "Shopify" },
  { value: "WORDPRESS", label: "WordPress / WooCommerce" },
  { value: "SQUARESPACE", label: "Squarespace" },
  { value: "SIMPLEPRESS", label: "SimplePress" },
] as const;

/** Platforms recorded on products but with no automatic feed. */
const MANUAL_PLATFORMS = [
  { value: "SQUARE", label: "Square (manual only)" },
  { value: "MANUAL", label: "Manual entry only" },
] as const;

const formatDate = (date: Date | string | null) =>
  date
    ? new Date(date).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export function SyncRunsClient({
  runs,
  shopConfigs,
  isAdmin,
}: {
  runs: Runs;
  shopConfigs: ShopConfigs;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const pendingCount = runs.filter(
    (run) => run.status === "PENDING_REVIEW",
  ).length;

  const syncAll = api.productSync.syncAllNow.useMutation({
    onSuccess: (summary) => {
      toast.success(
        `${summary.shopsPlanned} shop${summary.shopsPlanned === 1 ? "" : "s"} synced, ` +
          `${summary.shopsSkipped} skipped, ${summary.shopsFailed} failed.`,
      );
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const syncableCount = shopConfigs.filter((s) => s.syncEnabled).length;

  return (
    <Tabs defaultValue="runs" className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="runs">
            Runs
            {pendingCount > 0 && (
              <Badge className="ml-2 rounded-full px-1.5">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">
            {isAdmin ? "Shop settings" : "My shop settings"}
          </TabsTrigger>
        </TabsList>

        {/* Sweeping every artisan's storefront is a platform-wide action, so
            it stays with admins even though artisans can sync their own. */}
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            disabled={syncAll.isPending || syncableCount === 0}
            title={
              syncableCount === 0
                ? "No shops have sync switched on yet"
                : `Sync all ${syncableCount} enabled shops now`
            }
            onClick={() => syncAll.mutate()}
          >
            <RefreshCw
              className={`mr-1 h-4 w-4 ${syncAll.isPending ? "animate-spin" : ""}`}
            />
            {syncAll.isPending
              ? "Syncing all shops…"
              : `Sync all shops (${syncableCount})`}
          </Button>
        )}
      </div>

      <TabsContent value="runs" className="mt-6">
        <RunsTable runs={runs} isAdmin={isAdmin} />
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <ShopSettings shopConfigs={shopConfigs} isAdmin={isAdmin} />
      </TabsContent>
    </Tabs>
  );
}

function RunsTable({ runs, isAdmin }: { runs: Runs; isAdmin: boolean }) {
  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center">
          <p>No sync runs yet.</p>
          <p className="mt-1 text-sm">
            Set up your store under{" "}
            <strong>{isAdmin ? "Shop settings" : "My shop settings"}</strong>,
            then use <strong>Sync now</strong> to try it — or wait for the
            weekly check.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">New</TableHead>
              <TableHead className="text-right">Updated</TableHead>
              <TableHead className="text-right">Missing</TableHead>
              <TableHead>Started</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-medium">
                  {run.shop.name}
                  {run.triggeredManually && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      (manual)
                    </span>
                  )}
                  {run.insecureTLSCode && (
                    <span
                      className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
                      title={`TLS verification was skipped (${run.insecureTLSCode})`}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Certificate problem
                    </span>
                  )}
                  {run.errorMessage && (
                    <p className="text-muted-foreground mt-1 max-w-md text-xs">
                      {run.errorMessage}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {run.platform}
                </TableCell>
                <TableCell>
                  <SyncStatusBadge status={run.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {run.counts.created || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {run.counts.updated || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {run.counts.missing || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(run.startedAt)}
                </TableCell>
                <TableCell className="text-right">
                  {run.status === "PENDING_REVIEW" && (
                    <Button asChild size="sm">
                      <Link href={`/admin/products/sync/${run.id}`}>
                        Review
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  {run.status === "APPLIED" && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/products/sync/${run.id}`}>View</Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ShopSettings({
  shopConfigs,
  isAdmin,
}: {
  shopConfigs: ShopConfigs;
  isAdmin: boolean;
}) {
  if (shopConfigs.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center">
          You don&apos;t have a shop set up yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {isAdmin
          ? "Only shops with sync switched on are visited by the weekly job. Square shops and anything without a public product feed should stay off and be imported by hand."
          : "With sync switched on, we check your website once a week and show you what changed. Nothing is published until you approve it, and your categories and tags are never touched."}
      </p>
      {shopConfigs.map((shop) => (
        <ShopSyncCard key={shop.id} shop={shop} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

function ShopSyncCard({
  shop,
  isAdmin,
}: {
  shop: ShopConfigs[number];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [platform, setPlatform] = useState<string>(
    shop.syncPlatform ?? "NONE",
  );
  const [enabled, setEnabled] = useState(shop.syncEnabled);
  const [syncUrl, setSyncUrl] = useState(shop.syncUrl ?? "");
  const [allowInsecure, setAllowInsecure] = useState(shop.allowInsecureOrigin);

  const isSyncable = SYNCABLE_PLATFORMS.some((p) => p.value === platform);

  const save = api.productSync.updateShopConfig.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      router.refresh();
    },
    onError: (err) => {
      // A rejected feed URL comes back as a field-level zod issue; show that
      // sentence rather than the serialized issue list.
      const fieldErrors = err.data?.zodError?.fieldErrors;
      toast.error(fieldErrors?.syncUrl?.[0] ?? err.message);
    },
  });

  const runNow = api.productSync.runNow.useMutation({
    onSuccess: (result) => {
      if (result.status === "FAILED") {
        toast.error(result.errorMessage ?? "The sync failed.");
      } else if (result.status === "EMPTY") {
        toast.success("Already up to date — nothing to review.");
      } else {
        toast.success(
          `${result.created} new, ${result.updated} updated, ${result.missing} missing. Ready to review.`,
        );
      }
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const dirty =
    platform !== (shop.syncPlatform ?? "NONE") ||
    enabled !== shop.syncEnabled ||
    syncUrl !== (shop.syncUrl ?? "") ||
    allowInsecure !== shop.allowInsecureOrigin;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{shop.name}</CardTitle>
            <CardDescription>
              {shop.website ?? "No website on file"} · {shop._count.products}{" "}
              products · Last synced {formatDate(shop.lastSyncedAt)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label
              htmlFor={`enabled-${shop.id}`}
              className="text-muted-foreground text-sm"
            >
              Sync
            </Label>
            <Switch
              id={`enabled-${shop.id}`}
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={!isSyncable}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`platform-${shop.id}`}>Platform</Label>
            <Select
              value={platform}
              onValueChange={(value) => {
                setPlatform(value);
                // Turning off automatic syncing is implicit in choosing a
                // platform we can't fetch — don't leave a dead toggle on.
                if (!SYNCABLE_PLATFORMS.some((p) => p.value === value)) {
                  setEnabled(false);
                }
              }}
            >
              <SelectTrigger id={`platform-${shop.id}`}>
                <SelectValue placeholder="Not configured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Not configured</SelectItem>
                {SYNCABLE_PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
                {MANUAL_PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`url-${shop.id}`}>
              {platform === "SQUARESPACE" ? (
                "Your shop page URL"
              ) : (
                <>
                  Feed URL{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </>
              )}
            </Label>
            <Input
              id={`url-${shop.id}`}
              value={syncUrl}
              placeholder={
                platform === "SQUARESPACE"
                  ? "https://example.com/shop"
                  : (shop.website ?? "https://example.com")
              }
              onChange={(e) => setSyncUrl(e.target.value)}
            />
            {/* Squarespace is the one platform where the default (the shop's
                homepage) is usually wrong, so it gets real instructions rather
                than a footnote — artisans set this themselves. */}
            <p className="text-muted-foreground text-xs">
              {platform === "SQUARESPACE" ? (
                <>
                  Squarespace doesn&apos;t publish a site-wide product list, so
                  we read the page your products are actually on. Open your
                  shop page in a browser and copy the address from the bar —
                  usually something like{" "}
                  <code className="text-foreground">yoursite.com/shop</code> or{" "}
                  <code className="text-foreground">yoursite.com/store</code>.
                  Your homepage won&apos;t work.
                </>
              ) : platform === "SHOPIFY" ||
                platform === "WORDPRESS" ||
                platform === "SIMPLEPRESS" ? (
                "Leave blank — we can find your products from your website address."
              ) : (
                "Leave blank to use the shop's website."
              )}
            </p>
          </div>
        </div>

        {/* Reaching a store over plaintext is a platform security decision, so
            only admins can set it. Artisans just see that it's on. */}
        {isAdmin ? (
          <div className="flex items-start gap-3 rounded-md border p-3">
            <Switch
              id={`insecure-${shop.id}`}
              checked={allowInsecure}
              onCheckedChange={setAllowInsecure}
            />
            <div className="space-y-1">
              <Label htmlFor={`insecure-${shop.id}`}>
                Allow plain HTTP for this store
              </Label>
              <p className="text-muted-foreground text-xs">
                For storefronts without a working certificate. Private and
                internal addresses are still blocked. Their product images will
                stay on http and fall back to the shop logo on AF.
              </p>
            </div>
          </div>
        ) : (
          allowInsecure && (
            <p className="text-muted-foreground rounded-md border p-3 text-xs">
              Your site is being read over plain HTTP because it has no valid
              security certificate. Product images may not display on AF until
              that&apos;s fixed — ask an admin if you need a hand.
            </p>
          )
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!isSyncable || !enabled || runNow.isPending || dirty}
            title={
              dirty
                ? "Save your changes first"
                : !isSyncable
                  ? "This platform has no automatic feed"
                  : !enabled
                    ? "Turn sync on first"
                    : undefined
            }
            onClick={() => runNow.mutate({ shopId: shop.id })}
          >
            <RefreshCw
              className={`mr-1 h-4 w-4 ${runNow.isPending ? "animate-spin" : ""}`}
            />
            {runNow.isPending ? "Checking your site…" : "Sync now"}
          </Button>
          <Button
            size="sm"
            disabled={!dirty || save.isPending}
            onClick={() =>
              save.mutate({
                shopId: shop.id,
                syncPlatform:
                  platform === "NONE"
                    ? null
                    : (platform as "SHOPIFY" | "WORDPRESS"),
                syncEnabled: enabled,
                syncUrl: syncUrl.trim() || null,
                // Server ignores this unless the caller is an admin.
                ...(isAdmin ? { allowInsecureOrigin: allowInsecure } : {}),
              })
            }
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
