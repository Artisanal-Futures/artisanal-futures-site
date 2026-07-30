"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";

import { ChangeUserRoleDialog } from "../_components/change-user-role-dialog";
import { DeleteUserDialog } from "../_components/delete-user-dialog";
import { SendResetPasswordDialog } from "../_components/send-reset-password-dialog";

type RoleValue =
  | "USER"
  | "ADMIN"
  | "ARTISAN"
  | "DRIVER"
  | "GUEST"
  | "MANAGER";

type Props = {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  currentRole: RoleValue;
  hasCredential: boolean;
};

export function UserDetailActions({
  userId,
  userName,
  userEmail,
  currentRole,
  hasCredential,
}: Props) {
  const router = useRouter();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const isSelf = session?.user?.id === userId;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setRoleDialogOpen(true)}
      >
        Change role
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!hasCredential}
        onClick={() => setResetDialogOpen(true)}
      >
        Send reset password
      </Button>
      {!isSelf && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete user
        </Button>
      )}

      <ChangeUserRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        userId={userId}
        userName={userName}
        currentRole={currentRole}
      />

      <SendResetPasswordDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        userId={userId}
        userEmail={userEmail}
      />

      {!isSelf && (
        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          onDeleted={() => router.push("/admin/users")}
        />
      )}
    </div>
  );
}
