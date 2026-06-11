"use client";

import { toast } from "sonner";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string | null;
};

export function SendResetPasswordDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
}: Props) {
  const sendPasswordReset = api.user.sendPasswordReset.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to send password reset email.");
    },
  });

  const handleConfirm = () => {
    sendPasswordReset.mutate({ userId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send password reset email</DialogTitle>
          <DialogDescription>
            A password reset link will be sent to{" "}
            <span className="font-medium">{userEmail ?? "this user"}</span>.
            This only works for users who signed up with email and password.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={sendPasswordReset.isPending}
          >
            {sendPasswordReset.isPending ? "Sending…" : "Send reset email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
