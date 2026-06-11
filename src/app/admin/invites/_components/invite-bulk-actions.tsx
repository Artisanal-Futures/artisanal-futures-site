"use client";

import { XIcon } from "lucide-react";

import { Button } from "~/components/ui/button";

import { DeleteMultipleInvitesDialog } from "./delete-multiple-invites";

type Props = {
  selectedInviteIds: string[];
  onClear: () => void;
};

export function InviteBulkActions({ selectedInviteIds, onClear }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedInviteIds.length} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <DeleteMultipleInvitesDialog
        inviteIds={selectedInviteIds}
        onSuccessCallback={onClear}
      />

      <div className="h-4 w-px bg-border" />

      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={onClear}
      >
        <XIcon className="h-4 w-4" />
        <span className="sr-only">Clear selection</span>
      </Button>
    </div>
  );
}
