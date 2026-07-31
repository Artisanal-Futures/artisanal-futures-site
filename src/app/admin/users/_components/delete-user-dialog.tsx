"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  /** Called after a successful delete, before the router refresh. */
  onDeleted?: () => void;
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

export function DeleteUserDialog({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  onDeleted,
}: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();
  const [confirmation, setConfirmation] = useState("");

  // Reset the type-to-confirm field whenever the dialog is (re)opened.
  useEffect(() => {
    if (open) setConfirmation("");
  }, [open]);

  // Real counts for the impact summary. Only fetched while the dialog is open.
  const { data: detail, isLoading } = api.user.getUserDetail.useQuery(
    { userId },
    { enabled: open },
  );

  const deleteUser = api.user.delete.useMutation({
    onSuccess: ({ message }) => {
      toast.success(message);
      onOpenChange(false);
      void apiUtils.user.invalidate();
      onDeleted?.();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete user.");
    },
  });

  const shopCount = detail?.shops.length ?? 0;
  const eventCount =
    detail?.shops.reduce((total, shop) => total + shop._count.events, 0) ?? 0;
  const postCount = detail?._count.posts ?? 0;
  const commentCount = detail?._count.forumComments ?? 0;

  // Fall back to the name (then a literal) when the user has no email on file.
  const confirmationTarget = userEmail ?? userName ?? "DELETE";
  const canConfirm =
    confirmation.trim().toLowerCase() === confirmationTarget.toLowerCase();

  const label = userName ?? userEmail ?? userId;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-destructive">
            Delete user?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to permanently delete{" "}
            <span className="font-medium">{label}</span>
            {userEmail && userName ? ` (${userEmail})` : null}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 text-sm">
          <ul className="text-muted-foreground list-disc space-y-1 pl-5">
            <li>
              {isLoading ? "…" : plural(shopCount, "shop")} and all their
              products and services
            </li>
            <li>{isLoading ? "…" : plural(eventCount, "event")}</li>
            <li>their notifications and AI-generation history</li>
            <li>
              Their {isLoading ? "…" : plural(postCount, "forum post")} and{" "}
              {isLoading ? "…" : plural(commentCount, "comment")} will remain
              visible, reassigned to &ldquo;Deleted User&rdquo;
            </li>
          </ul>

          <p className="text-destructive font-medium">This cannot be undone.</p>

          <div className="grid gap-2">
            <Label htmlFor="delete-user-confirm">
              Type <span className="font-mono">{confirmationTarget}</span> to
              confirm
            </Label>
            <Input
              id="delete-user-confirm"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={confirmationTarget}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!canConfirm || deleteUser.isPending}
            onClick={(e) => {
              // Keep the dialog open until the mutation settles.
              e.preventDefault();
              if (!canConfirm) return;
              deleteUser.mutate({ userId });
            }}
          >
            {deleteUser.isPending ? "Deleting…" : "Delete user"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
