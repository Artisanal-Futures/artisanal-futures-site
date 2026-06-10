"use client";

import { Trash2Icon } from "lucide-react";
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

export function DeleteMultipleInvitesDialog({
  inviteIds,
  onSuccessCallback,
}: {
  inviteIds: string[];
  onSuccessCallback?: () => void;
}) {
  const apiUtils = api.useUtils();

  const deleteInvites = api.invite.deleteManyInvites.useMutation({
    onMutate: () => {
      toast.loading("Deleting invites, please wait...");
    },
    onSuccess: () => {
      toast.dismiss();
      toast.success("Invites deleted successfully.");
      void apiUtils.invite.invalidate();
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete invites.");
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="h-8 text-xs lg:px-3">
          <Trash2Icon className="mr-2 h-4 w-4" />
          Delete ({inviteIds.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>
            Delete {inviteIds.length} invite(s)?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete these invites and remove the data from
            our servers. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => deleteInvites.mutate(inviteIds)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
