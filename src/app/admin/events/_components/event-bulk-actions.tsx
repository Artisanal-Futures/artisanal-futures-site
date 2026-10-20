"use client";

import { XIcon } from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

import { BulkDeleteButton } from "../../_components/bulk-delete-button";

type Props = {
  selectedEventIds: string[];
  onClear: () => void;
};

export function EventBulkActions({ selectedEventIds, onClear }: Props) {
  const apiUtils = api.useUtils();

  const deleteEvents = api.event.deleteMany.useMutation({
    onSuccess: () => apiUtils.event.invalidate(),
  });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedEventIds.length} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <BulkDeleteButton
        ids={selectedEventIds}
        itemLabel={{ singular: "event", plural: "events" }}
        onDelete={deleteEvents.mutateAsync}
        isPending={deleteEvents.isPending}
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
