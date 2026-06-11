"use client";

import { Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

type Props = {
  selectedEventIds: string[];
  onClear: () => void;
};

export function EventBulkActions({ selectedEventIds, onClear }: Props) {
  const apiUtils = api.useUtils();

  const deleteEvents = api.event.deleteMany.useMutation({
    onMutate: () => {
      toast.loading("Deleting events, please wait...");
    },
    onSuccess: async () => {
      toast.dismiss();
      toast.success("Events deleted successfully.");
      await apiUtils.event.invalidate();
      onClear();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete events.");
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedEventIds.length} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="h-8 text-xs lg:px-3"
            disabled={deleteEvents.isPending}
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete ({selectedEventIds.length})
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Delete {selectedEventIds.length} event
              {selectedEventIds.length !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete these events and remove the data from
              our servers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteEvents.mutate(selectedEventIds)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
