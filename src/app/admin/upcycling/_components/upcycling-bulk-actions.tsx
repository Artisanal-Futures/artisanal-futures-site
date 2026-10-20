"use client";

import { XIcon } from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

import { BulkDeleteButton } from "../../_components/bulk-delete-button";

type Props = {
  selectedIds: number[];
  onClear: () => void;
};

export function UpcyclingBulkActions({ selectedIds, onClear }: Props) {
  const apiUtils = api.useUtils();

  const deleteItems = api.upcycling.deleteMany.useMutation({
    onSuccess: () => apiUtils.upcycling.invalidate(),
  });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedIds.length} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <BulkDeleteButton
        ids={selectedIds}
        itemLabel={{ singular: "upcycling item", plural: "upcycling items" }}
        onDelete={deleteItems.mutateAsync}
        isPending={deleteItems.isPending}
        onSuccess={onClear}
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
