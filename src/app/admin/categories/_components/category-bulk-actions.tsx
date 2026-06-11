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
  selectedCategoryIds: string[];
  onClear: () => void;
};

export function CategoryBulkActions({
  selectedCategoryIds,
  onClear,
}: Props) {
  const apiUtils = api.useUtils();

  const deleteCategories = api.category.deleteMany.useMutation({
    onMutate: () => {
      toast.loading("Deleting categories, please wait...");
    },
    onSuccess: async () => {
      toast.dismiss();
      toast.success("Categories deleted successfully.");
      await apiUtils.category.invalidate();
      onClear();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete categories.");
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        {selectedCategoryIds.length} selected
      </span>

      <div className="h-4 w-px bg-border" />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="h-8 text-xs lg:px-3"
            disabled={deleteCategories.isPending}
          >
            <Trash2Icon className="mr-2 h-4 w-4" />
            Delete ({selectedCategoryIds.length})
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Delete {selectedCategoryIds.length} categor
              {selectedCategoryIds.length !== 1 ? "ies" : "y"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete these categories and remove the data
              from our servers. Child categories will also be removed. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deleteCategories.mutate(selectedCategoryIds)}
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
