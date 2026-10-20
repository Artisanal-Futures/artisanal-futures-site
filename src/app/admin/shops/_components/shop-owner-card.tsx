"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, MailCheck, UserRoundCog } from "lucide-react";
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
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

import {
  ChangeOwnerDialog,
  RoleBadge,
  UserIdentity,
} from "./change-owner-dialog";

type Props = {
  shopId: string;
  shopName: string;
};

/**
 * Admin-only view of who owns a shop, with controls to hand it to another
 * account or invite someone to claim it.
 */
export function ShopOwnerCard({ shopId, shopName }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const apiUtils = api.useUtils();
  const router = useRouter();

  const ownership = api.shop.getOwnership.useQuery({ shopId });
  const owner = ownership.data?.owner;
  const pendingInvite = ownership.data?.pendingInvite ?? null;

  const cancelInvite = api.invite.delete.useMutation({
    onSuccess: () => {
      toast.success("Invite cancelled.");
      void apiUtils.shop.getOwnership.invalidate({ shopId });
      void apiUtils.invite.listInvites.invalidate();
      void apiUtils.invite.listAttachableShops.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to cancel invite.");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Owner</CardTitle>
          <Badge variant="secondary">Admin only</Badge>
        </div>
        <CardDescription>
          The account that manages this shop. Transferring it moves the shop and
          its website to the new owner.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ownership.isLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
        ) : ownership.isError ? (
          <p className="text-destructive text-sm">
            Failed to load the owner: {ownership.error.message}
          </p>
        ) : owner ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <UserIdentity user={owner} size="lg" />
            <div className="flex items-center gap-2">
              <RoleBadge role={owner.role} />
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/admin/users/${owner.id}`}>
                  View user
                  <ExternalLink className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ) : null}

        {pendingInvite ? (
          <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <MailCheck className="size-4 shrink-0" />
              <span>
                Invite pending to{" "}
                <span className="text-foreground font-medium">
                  {pendingInvite.email}
                </span>{" "}
                · expires {pendingInvite.expiresAt.toLocaleDateString()}
              </span>
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelInvite.isPending}
                >
                  {cancelInvite.isPending ? "Cancelling…" : "Cancel invite"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this invite?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The code sent to {pendingInvite.email} stops working and
                    they won&apos;t be able to claim {shopName} with it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep invite</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      cancelInvite.mutate({ id: pendingInvite.id })
                    }
                  >
                    Cancel invite
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogOpen(true)}
          disabled={!ownership.isSuccess}
        >
          <UserRoundCog className="size-4" />
          Change owner
        </Button>

        <ChangeOwnerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          shopId={shopId}
          shopName={shopName}
          currentOwnerId={owner?.id}
          pendingInvite={pendingInvite}
        />
      </CardContent>
    </Card>
  );
}
