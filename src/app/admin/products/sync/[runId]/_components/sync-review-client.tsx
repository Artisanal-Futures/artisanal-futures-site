"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, EyeOff, Lock, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Separator } from "~/components/ui/separator";
import { ImageWithFallback } from "~/components/image-with-fallback";

import { SyncStatusBadge } from "../../_components/sync-status-badge";

type Run = RouterOutputs["productSync"]["getRun"];
type Proposal = Run["proposals"][number];

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  priceInCents: "Price",
  currency: "Currency",
  imageUrl: "Image",
  productUrl: "Link",
};

const MATCH_LABELS: Record<string, string> = {
  shopProductId: "matched on store ID",
  productUrl: "matched on product URL",
  name: "matched on product name",
};

function formatValue(field: string, value: string | number | null) {
  if (value === null) return "—";
  if (field === "priceInCents" && typeof value === "number") {
    return `$${(value / 100).toFixed(2)}`;
  }
  return String(value);
}

export function SyncReviewClient({ run }: { run: Run }) {
  const router = useRouter();
  const isResolved = run.status !== "PENDING_REVIEW";

  const groups = useMemo(
    () => ({
      CREATE: run.proposals.filter((p) => p.changeType === "CREATE"),
      UPDATE: run.proposals.filter((p) => p.changeType === "UPDATE"),
      MISSING: run.proposals.filter((p) => p.changeType === "MISSING"),
    }),
    [run.proposals],
  );

  // New products and updates are pre-selected; hiding a product is the
  // destructive one, so it starts unchecked and has to be opted into.
  const [selected, setSelected] = useState<Set<string>>(
    () =>
      new Set(
        run.proposals
          .filter((p) => p.changeType !== "MISSING")
          .map((p) => p.id),
      ),
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleGroup = (proposals: Proposal[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of proposals) {
        if (on) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });

  const apply = api.productSync.applyRun.useMutation({
    onSuccess: (result) => {
      toast.success(
        `${result.created} created, ${result.updated} updated, ${result.hidden} hidden, ${result.rejected} skipped.`,
      );
      router.push("/admin/products/sync");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const discard = api.productSync.discardRun.useMutation({
    onSuccess: () => {
      toast.success("Sync run discarded.");
      router.push("/admin/products/sync");
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <>
      <div className="admin-header">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
              <Link href="/admin/products/sync">
                <ArrowLeft className="mr-1 h-4 w-4" />
                All runs
              </Link>
            </Button>
            <h1>{run.shop.name}</h1>
            <p>
              {run.platform} · {run.fetchedCount} products read from the store ·{" "}
              {new Date(run.startedAt).toLocaleString()}
            </p>
          </div>
          <SyncStatusBadge status={run.status} />
        </div>
      </div>

      {run.insecureTLSCode && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This store&apos;s security certificate is invalid or expired (
            <code>{run.insecureTLSCode}</code>), so it was read without
            verification. Worth asking the artisan to renew it.
          </p>
        </div>
      )}

      {run.errorMessage && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{run.errorMessage}</p>
        </div>
      )}

      {run.proposals.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="text-muted-foreground py-12 text-center">
            This run proposed no changes.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          <ProposalGroup
            title="New products"
            description="On the storefront but not yet on AF. They arrive with no categories or tags — you'll want to tag them afterwards."
            icon={<Plus className="h-4 w-4" />}
            proposals={groups.CREATE}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleGroup}
            disabled={isResolved}
          />
          <ProposalGroup
            title="Updated products"
            description="Matched to a product already on AF. Categories, tags and visibility are never touched — a hidden product stays hidden until you publish it yourself."
            icon={<RefreshCw className="h-4 w-4" />}
            proposals={groups.UPDATE}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleGroup}
            disabled={isResolved}
          />
          <ProposalGroup
            title="No longer on the storefront"
            description="Approving hides these on AF. They are never deleted, and can be made public again by hand."
            icon={<EyeOff className="h-4 w-4" />}
            proposals={groups.MISSING}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleGroup}
            disabled={isResolved}
          />
        </div>
      )}

      {!isResolved && run.proposals.length > 0 && (
        <div className="bg-background/95 sticky bottom-0 mt-8 flex items-center justify-between gap-4 border-t py-4 backdrop-blur">
          <p className="text-muted-foreground text-sm">
            <strong className="text-foreground">{selected.size}</strong> of{" "}
            {run.proposals.length} selected. Unselected changes are rejected.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={discard.isPending || apply.isPending}
              onClick={() => discard.mutate({ runId: run.id })}
            >
              Discard run
            </Button>
            <Button
              disabled={apply.isPending || discard.isPending}
              onClick={() =>
                apply.mutate({
                  runId: run.id,
                  approvedProposalIds: [...selected],
                })
              }
            >
              {apply.isPending
                ? "Applying…"
                : `Apply ${selected.size} change${selected.size === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function ProposalGroup({
  title,
  description,
  icon,
  proposals,
  selected,
  onToggle,
  onToggleAll,
  disabled,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  proposals: Proposal[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (proposals: Proposal[], on: boolean) => void;
  disabled: boolean;
}) {
  if (proposals.length === 0) return null;

  const allSelected = proposals.every((p) => selected.has(p.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
              <Badge variant="secondary">{proposals.length}</Badge>
            </CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>
          {!disabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleAll(proposals, !allSelected)}
            >
              {allSelected ? "Deselect all" : "Select all"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {proposals.map((proposal) => (
          <ProposalRow
            key={proposal.id}
            proposal={proposal}
            checked={selected.has(proposal.id)}
            onToggle={() => onToggle(proposal.id)}
            disabled={disabled}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function ProposalRow({
  proposal,
  checked,
  onToggle,
  disabled,
}: {
  proposal: Proposal;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const applicable = proposal.diff.filter((d) => !d.protected);
  const protectedEntries = proposal.diff.filter((d) => d.protected);

  return (
    <div className="flex gap-3 rounded-md border p-3">
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label={`Include ${proposal.payload.name}`}
        className="mt-1"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <div className="bg-muted relative h-12 w-12 shrink-0 overflow-hidden rounded">
            <ImageWithFallback
              // next/image rejects an empty src, so fall straight through to
              // the placeholder when the store gave us no image at all.
              src={proposal.payload.imageUrl ?? "/logos/logo.png"}
              fallbackSrc="/logos/logo.png"
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{proposal.payload.name}</p>
            <p className="text-muted-foreground text-xs">
              Store ID {proposal.shopProductId || "—"}
              {proposal.matchedBy && (
                <> · {MATCH_LABELS[proposal.matchedBy] ?? proposal.matchedBy}</>
              )}
            </p>
            {proposal.product && proposal.product.categories.length > 0 && (
              <p className="text-muted-foreground mt-1 text-xs">
                Keeping{" "}
                {proposal.product.categories.map((c) => c.name).join(", ")}
                {proposal.product.tags.length > 0 &&
                  ` · ${proposal.product.tags.length} tag${
                    proposal.product.tags.length === 1 ? "" : "s"
                  }`}
              </p>
            )}
          </div>
        </div>

        {proposal.changeType === "MISSING" && (
          <p className="text-muted-foreground mt-2 text-sm">
            Not found in the latest read of the storefront. Approving hides it
            from AF.
          </p>
        )}

        {proposal.changeType === "UPDATE" &&
          applicable.length === 0 &&
          protectedEntries.length === 0 && (
            <p className="text-muted-foreground mt-2 text-sm">
              No field changes — approving just records the store&apos;s product
              ID so future syncs match it directly instead of creating a
              duplicate.
            </p>
          )}

        {applicable.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {applicable.map((entry) => (
              <div
                key={entry.field}
                className="grid grid-cols-[7rem_1fr] gap-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {FIELD_LABELS[entry.field] ?? entry.field}
                </span>
                <span className="min-w-0">
                  {proposal.changeType === "UPDATE" && (
                    <>
                      <span className="text-muted-foreground line-clamp-2 line-through">
                        {formatValue(entry.field, entry.before)}
                      </span>
                      <Separator className="my-1" />
                    </>
                  )}
                  <span className="line-clamp-2 break-words">
                    {formatValue(entry.field, entry.after)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        {protectedEntries.length > 0 && (
          <div className="bg-muted/50 mt-3 rounded-md p-2">
            <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
              <Lock className="h-3 w-3" />
              Kept your edits — not changed
            </p>
            <div className="mt-1.5 space-y-1">
              {protectedEntries.map((entry) => (
                <div
                  key={entry.field}
                  className="text-muted-foreground grid grid-cols-[7rem_1fr] gap-2 text-xs"
                >
                  <span>{FIELD_LABELS[entry.field] ?? entry.field}</span>
                  <span className="line-clamp-1">
                    store has &ldquo;{formatValue(entry.field, entry.after)}
                    &rdquo;
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
