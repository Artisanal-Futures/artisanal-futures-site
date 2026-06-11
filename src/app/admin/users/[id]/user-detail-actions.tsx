"use client";

import { useState } from "react";

import { Button } from "~/components/ui/button";

import { ChangeUserRoleDialog } from "../_components/change-user-role-dialog";
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
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

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
    </div>
  );
}
