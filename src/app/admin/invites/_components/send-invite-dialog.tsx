"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
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
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function SendInviteDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ARTISAN" | "GUEST" | "ADMIN">("GUEST");
  const [shopId, setShopId] = useState<string | undefined>();

  const apiUtils = api.useUtils();

  const attachableShops = api.invite.listAttachableShops.useQuery(undefined, {
    enabled: open && role === "ARTISAN",
  });

  const createInvite = api.invite.createInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite sent successfully.");
      setEmail("");
      setRole("GUEST");
      setShopId(undefined);
      setOpen(false);
      void apiUtils.invite.listInvites.invalidate();
      void apiUtils.invite.listAttachableShops.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to send invite.");
    },
  });

  const handleRoleChange = (v: "ARTISAN" | "GUEST" | "ADMIN") => {
    setRole(v);
    if (v !== "ARTISAN") {
      setShopId(undefined);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    createInvite.mutate({
      email: email.trim(),
      role,
      shopId:
        role === "ARTISAN" && shopId && shopId !== "none" ? shopId : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-8 text-xs" size="sm">
          <PlusIcon className="mr-1 h-4 w-4" />
          Send invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Send platform invite</DialogTitle>
            <DialogDescription>
              Send an invitation email with a one-time code. The recipient can
              join as an Artisan, Guest, or Admin. Codes expire in 30 days.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={role}
                onValueChange={(v) =>
                  handleRoleChange(v as "ARTISAN" | "GUEST" | "ADMIN")
                }
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARTISAN">Artisan</SelectItem>
                  <SelectItem value="GUEST">Guest</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === "ARTISAN" && (
              <div className="grid gap-2">
                <Label htmlFor="invite-shop">Attach existing shop (optional)</Label>
                <Select
                  value={shopId ?? "none"}
                  onValueChange={(v) => setShopId(v)}
                >
                  <SelectTrigger id="invite-shop">
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
                      const disabled = !!shop.pendingInviteId;
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
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createInvite.isPending}>
              {createInvite.isPending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
