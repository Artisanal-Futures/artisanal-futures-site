"use client";

import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

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

type Props<TId extends string | number> = {
  ids: TId[];
  itemLabel: { singular: string; plural: string };
  /** Pass the tRPC mutation's `mutateAsync`. */
  onDelete: (ids: TId[]) => Promise<unknown>;
  isPending?: boolean;
  /** Called after a successful delete, e.g. to clear the table selection. */
  onSuccess?: () => void;
  /** Extra sentence appended to the default confirmation description. */
  descriptionSuffix?: string;
};

/**
 * Shared "Delete (N)" bulk-action button with its confirmation dialog.
 * Handles the scoped loading/success/error toast and `router.refresh()`
 * (admin list pages are server-rendered). Cache invalidation belongs in the
 * mutation's own `onSuccess`.
 */
export function BulkDeleteButton<TId extends string | number>({
  ids,
  itemLabel,
  onDelete,
  isPending,
  onSuccess,
  descriptionSuffix,
}: Props<TId>) {
  const router = useRouter();
  const label = ids.length === 1 ? itemLabel.singular : itemLabel.plural;

  const handleDelete = async () => {
    const toastId = toast.loading(
      `Deleting ${itemLabel.plural}, please wait...`,
    );
    try {
      await onDelete(ids);
      toast.success(`${ids.length} ${label} deleted successfully.`, {
        id: toastId,
      });
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : `Failed to delete ${itemLabel.plural}.`,
        { id: toastId },
      );
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="h-8 text-xs lg:px-3"
          disabled={isPending}
        >
          <Trash2Icon className="mr-2 h-4 w-4" />
          Delete ({ids.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>
            Delete {ids.length} {label}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the selected {itemLabel.plural} and
            remove the data from our servers.
            {descriptionSuffix ? ` ${descriptionSuffix}` : ""} This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => void handleDelete()}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
