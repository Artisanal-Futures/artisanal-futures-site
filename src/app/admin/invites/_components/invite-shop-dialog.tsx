"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

type InviteShopDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteId: string;
  inviteEmail: string;
  currentShop: { id: string; name: string } | null;
};

export function InviteShopDialog({
  open,
  onOpenChange,
  inviteId,
  inviteEmail,
  currentShop,
}: InviteShopDialogProps) {
  const [selected, setSelected] = useState<string>(currentShop?.id ?? "none");

  const router = useRouter();
  const apiUtils = api.useUtils();

  // Sync the picker to the current shop whenever the dialog (re)opens or the
  // attached shop changes.
  useEffect(() => {
    setSelected(currentShop?.id ?? "none");
  }, [open, currentShop]);

  const attachableShops = api.invite.listAttachableShops.useQuery(undefined, {
    enabled: open,
  });

  const updateInviteShop = api.invite.updateInviteShop.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      void apiUtils.invite.invalidate();
      router.refresh();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update shop.");
    },
  });

  const handleSave = () => {
    updateInviteShop.mutate({
      inviteId,
      shopId: selected === "none" ? null : selected,
    });
  };

  const handleDetach = () => {
    updateInviteShop.mutate({ inviteId, shopId: null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach shop</DialogTitle>
          <DialogDescription>
            Attach or detach a shop for the invite sent to {inviteEmail}. No new
            email is sent; the existing invitation code stays valid.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-shop-select">
              Attach existing shop (optional)
            </Label>
            <Select value={selected} onValueChange={(v) => setSelected(v)}>
              <SelectTrigger id="invite-shop-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  No shop — create during onboarding
                </SelectItem>
                {attachableShops.isLoading && (
                  <SelectItem value="loading" disabled>
                    Loading shops…
                  </SelectItem>
                )}
                {attachableShops.data?.map((shop) => {
                  const label = shop.ownerLabel || shop.ownerName;
                  const disabled =
                    !!shop.pendingInviteId &&
                    shop.pendingInviteId !== inviteId;
                  return (
                    <SelectItem
                      key={shop.id}
                      value={shop.id}
                      disabled={disabled}
                    >
                      {shop.name} — {label}
                      {disabled ? " (pending invite)" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {attachableShops.isError && (
              <p className="text-destructive text-xs">
                Failed to load shops: {attachableShops.error.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              The invitee will take ownership of this shop when they finish
              onboarding.
            </p>
          </div>
        </div>
        <DialogFooter>
          {currentShop && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleDetach}
              disabled={updateInviteShop.isPending}
            >
              Detach shop
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateInviteShop.isPending}
          >
            {updateInviteShop.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
