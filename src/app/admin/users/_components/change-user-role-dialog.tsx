"use client";

import { useState } from "react";
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
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const ALL_ROLES = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
  { value: "ARTISAN", label: "Artisan" },
  { value: "DRIVER", label: "Driver" },
  { value: "GUEST", label: "Guest" },
  { value: "MANAGER", label: "Manager" },
] as const;

type RoleValue = (typeof ALL_ROLES)[number]["value"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string | null;
  currentRole: RoleValue;
};

export function ChangeUserRoleDialog({
  open,
  onOpenChange,
  userId,
  userName,
  currentRole,
}: Props) {
  const [role, setRole] = useState<RoleValue>(currentRole);

  const apiUtils = api.useUtils();

  const setUserRole = api.user.setUserRole.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      onOpenChange(false);
      void apiUtils.user.listUsers.invalidate();
      void apiUtils.user.getUserDetail.invalidate({ userId });
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update role.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserRole.mutate({ userId, role });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change user role</DialogTitle>
            <DialogDescription>
              Update the platform role for{" "}
              <span className="font-medium">{userName ?? userId}</span>. This
              affects what sections and actions they can access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as RoleValue)}
              >
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={setUserRole.isPending}>
              {setUserRole.isPending ? "Saving…" : "Save role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
