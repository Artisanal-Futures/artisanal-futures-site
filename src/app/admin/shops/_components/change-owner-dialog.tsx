"use client";

import type { Role } from "generated/prisma";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "~/trpc/react";
import { useDebounce } from "~/hooks/use-debounce";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Spinner } from "~/components/ui/spinner";

export type OwnerCandidate = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  image: string | null;
};

export type PendingShopInvite = {
  id: string;
  email: string;
  expiresAt: Date;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  shopName: string;
  currentOwnerId?: string;
  pendingInvite?: PendingShopInvite | null;
};

const emailSchema = z.string().email();

export function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export const roleBadge = (role: Role) => {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "ARTISAN":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "MANAGER":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "DRIVER":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case "USER":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "GUEST":
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge(role)}`}
    >
      {role}
    </span>
  );
}

/** Avatar, name and email for a user, as shown in owner rows. */
export function UserIdentity({
  user,
  size = "default",
}: {
  user: Pick<OwnerCandidate, "name" | "email" | "image">;
  size?: "sm" | "default" | "lg";
}) {
  const label = user.name ?? user.email ?? "Unnamed user";
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size={size}>
        {user.image ? <AvatarImage src={user.image} alt="" /> : null}
        <AvatarFallback>{getInitials(label)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        {user.email && user.name ? (
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
        ) : null}
      </div>
    </div>
  );
}

const canBePromoted = (role: Role) => role === "USER" || role === "GUEST";

export function ChangeOwnerDialog({
  open,
  onOpenChange,
  shopId,
  shopName,
  currentOwnerId,
  pendingInvite,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OwnerCandidate | null>(null);
  const [useOwnerName, setUseOwnerName] = useState(true);

  const debouncedQuery = useDebounce(query.trim(), 250);
  const isDebouncing = debouncedQuery !== query.trim();

  const apiUtils = api.useUtils();
  const router = useRouter();

  const candidates = api.user.searchOwnerCandidates.useQuery(
    { query: debouncedQuery },
    { enabled: open && debouncedQuery.length > 0 },
  );

  const reset = () => {
    setQuery("");
    setSelected(null);
    setUseOwnerName(true);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const refreshOwnership = () => {
    void apiUtils.shop.getOwnership.invalidate({ shopId });
    void apiUtils.invite.listInvites.invalidate();
    void apiUtils.invite.listAttachableShops.invalidate();
    router.refresh();
  };

  const transfer = api.shop.transferOwnership.useMutation({
    onSuccess: ({ owner, promoted }) => {
      const name = owner.name ?? owner.email ?? "the new owner";
      toast.success(`${shopName} now belongs to ${name}.`, {
        description: promoted ? `${name} was promoted to Artisan.` : undefined,
      });
      void apiUtils.shop.getShopOwners.invalidate();
      refreshOwnership();
      handleOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to transfer the shop.");
    },
  });

  const invite = api.invite.createInvite.useMutation({
    onSuccess: (created) => {
      if (created.emailSent) {
        toast.success(`Invite sent to ${created.email}.`);
      } else {
        toast.warning("Invite created, but the email failed to send.", {
          description: "Copy the link and share it with them directly.",
          duration: 15000,
          action: {
            label: "Copy link",
            onClick: () => {
              void navigator.clipboard
                .writeText(created.inviteUrl)
                .then(() => toast.success("Invite link copied."))
                .catch(() => toast.error("Couldn't copy the link."));
            },
          },
        });
      }
      refreshOwnership();
      handleOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to send invite.");
    },
  });

  const results = candidates.data ?? [];
  const normalizedQuery = debouncedQuery.toLowerCase();
  const queryIsEmail = emailSchema.safeParse(debouncedQuery).success;
  const showInviteRow =
    queryIsEmail &&
    !candidates.isFetching &&
    !results.some((user) => user.email?.toLowerCase() === normalizedQuery);
  const isSearching =
    debouncedQuery.length > 0 && (isDebouncing || candidates.isFetching);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {selected ? (
          <>
            <DialogHeader>
              <DialogTitle>
                Transfer {shopName} to{" "}
                {selected.name ?? selected.email ?? "this user"}?
              </DialogTitle>
              <DialogDescription>
                They become the shop&apos;s owner and can edit it from their
                dashboard. The current owner loses access, and any pending claim
                invite for this shop is cancelled.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                <UserIdentity user={selected} />
                <RoleBadge role={selected.role} />
              </div>

              {canBePromoted(selected.role) ? (
                <p className="text-muted-foreground text-sm">
                  They&apos;ll be promoted to Artisan.
                </p>
              ) : null}

              <div className="flex items-start gap-2">
                <Checkbox
                  id="use-owner-name"
                  checked={useOwnerName}
                  onCheckedChange={(checked) =>
                    setUseOwnerName(checked === true)
                  }
                  disabled={!selected.name?.trim()}
                />
                <div className="grid gap-1">
                  <Label htmlFor="use-owner-name">
                    Use their name as the owner name
                  </Label>
                  {!selected.name?.trim() ? (
                    <p className="text-muted-foreground text-xs">
                      This account has no name, so the current owner name is
                      kept.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelected(null)}
                disabled={transfer.isPending}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                type="button"
                disabled={transfer.isPending}
                onClick={() =>
                  transfer.mutate({
                    shopId,
                    userId: selected.id,
                    updateOwnerName: useOwnerName,
                  })
                }
              >
                {transfer.isPending ? "Transferring…" : "Transfer shop"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Change owner</DialogTitle>
              <DialogDescription>
                Find an existing account by name or email, or enter an email
                address to invite someone to claim {shopName}.
              </DialogDescription>
            </DialogHeader>

            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                autoFocus
                type="search"
                aria-label="Search users"
                placeholder="Search by name or email"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={100}
              />
              {isSearching ? (
                <Spinner className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2" />
              ) : null}
            </div>

            <div className="max-h-80 min-h-24 overflow-y-auto">
              {debouncedQuery.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Start typing to search users.
                </p>
              ) : candidates.isError ? (
                <p className="text-destructive py-6 text-center text-sm">
                  Search failed: {candidates.error.message}
                </p>
              ) : (
                <ul className="grid gap-1">
                  {results.map((user) => {
                    const isOwner = user.id === currentOwnerId;
                    return (
                      <li key={user.id}>
                        <button
                          type="button"
                          disabled={isOwner}
                          onClick={() => {
                            setUseOwnerName(!!user.name?.trim());
                            setSelected(user);
                          }}
                          className="hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                        >
                          <UserIdentity user={user} />
                          <span className="flex shrink-0 items-center gap-2">
                            {isOwner ? (
                              <span className="text-muted-foreground text-xs">
                                Current owner
                              </span>
                            ) : null}
                            <RoleBadge role={user.role} />
                          </span>
                        </button>
                      </li>
                    );
                  })}

                  {!isSearching &&
                  candidates.isSuccess &&
                  results.length === 0 ? (
                    <li className="text-muted-foreground py-4 text-center text-sm">
                      No users match &ldquo;{debouncedQuery}&rdquo;.
                    </li>
                  ) : null}

                  {showInviteRow && !isDebouncing ? (
                    <li className="mt-1 border-t pt-2">
                      {pendingInvite ? (
                        <p className="text-muted-foreground px-2 py-2 text-sm">
                          An invite to {pendingInvite.email} is already pending
                          — cancel it first.
                        </p>
                      ) : (
                        <button
                          type="button"
                          disabled={invite.isPending}
                          onClick={() =>
                            invite.mutate({
                              email: debouncedQuery,
                              role: "ARTISAN",
                              shopId,
                            })
                          }
                          className="hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none focus-visible:ring-[3px] disabled:opacity-60"
                        >
                          <span className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full">
                            {invite.isPending ? (
                              <Spinner />
                            ) : (
                              <Mail className="size-4" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              Invite {debouncedQuery} to claim this shop
                            </span>
                            <span className="text-muted-foreground block text-xs">
                              They&apos;ll get an Artisan invite. Ownership
                              moves when they sign up.
                            </span>
                          </span>
                        </button>
                      )}
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
