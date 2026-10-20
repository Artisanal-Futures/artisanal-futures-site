"use client";

import { useState } from "react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

import { ChangeOwnerDialog, UserIdentity } from "./change-owner-dialog";

type Props = {
  shopId: string;
  shopName: string;
};

/**
 * Admin-only owner summary for the shop toolbar. "Change" opens the transfer
 * dialog in place, so it never navigates away from unsaved edits.
 */
export function OwnerChip({ shopId, shopName }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const ownership = api.shop.getOwnership.useQuery({ shopId });
  const owner = ownership.data?.owner;

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="text-muted-foreground shrink-0 text-xs">Owner</span>
      {ownership.isLoading ? (
        <div className="flex items-center gap-2">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : owner ? (
        <div className="max-w-56 min-w-0">
          <UserIdentity user={owner} size="sm" />
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">Unknown</span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0"
        aria-label="Change owner"
        onClick={() => setDialogOpen(true)}
        disabled={!ownership.isSuccess}
      >
        Change
      </Button>

      <ChangeOwnerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shopId={shopId}
        shopName={shopName}
        currentOwnerId={owner?.id}
        pendingInvite={ownership.data?.pendingInvite ?? null}
      />
    </div>
  );
}
