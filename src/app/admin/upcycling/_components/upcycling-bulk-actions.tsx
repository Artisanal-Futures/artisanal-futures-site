"use client";

import { Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
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
import { Button } from "~/components/ui/button";

type Props = {
  selectedIds: number[];
  onClear: () => void;
};

export function UpcyclingBulkActions({ selectedIds, onClear }: Props) {
  const apiUtils = api.useUtils();

  const deleteItems = api.upcycling.deleteMany.useMutation({
    onMutate: () => {
      toast.loading("Deleting upcycling items, please wait...");
    },
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message);
      void apiUtils.upcycling.invalidate();
      onClear();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete upcycling items.");
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedIds.length} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="h-8 text-xs lg:px-3"
            disabled={deleteItems.isPending}
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete ({selectedIds.length})
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Delete {selectedIds.length} upcycling item(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected upcycling items. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteItems.mutate(selectedIds)}
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
