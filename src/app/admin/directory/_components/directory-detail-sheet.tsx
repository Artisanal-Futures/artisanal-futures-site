"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  Globe,
  Lock,
  Mail,
  MapPin,
  NotebookText,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Store,
  UserPlus,
  UserRound,
} from "lucide-react";

import type { DirectoryRow } from "~/server/api/routers/shops";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { SendInviteDialog } from "~/app/admin/invites/_components/send-invite-dialog";
import { PrivateContactForm } from "~/app/admin/shops/_components/private-contact-form";

import { CopyButton } from "./copy-button";

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function normalizeWebsite(website: string) {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function formatAddress(address: NonNullable<DirectoryRow["address"]>) {
  const cityLine = [
    [address.city, address.state].filter(Boolean).join(", "),
    address.zip,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    address.street ?? address.address,
    address.additional,
    cityLine,
    address.country,
  ]
    .filter((line): line is string => Boolean(line))
    .map((line) => line.trim())
    .filter(Boolean);
}

function DetailRow({
  icon: Icon,
  label,
  children,
  copyValue,
  copyLabel,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  copyValue?: string;
  copyLabel?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className="text-sm break-words">{children}</div>
        {hint ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
        ) : null}
      </div>
      {copyValue ? (
        <CopyButton value={copyValue} label={copyLabel ?? label} />
      ) : null}
    </div>
  );
}

function Missing() {
  return <span className="text-muted-foreground">—</span>;
}

function PrivateContactSection({ row }: { row: DirectoryRow }) {
  const [editing, setEditing] = useState(false);
  const contact = row.privateContact;
  const hasContact = [
    contact?.name,
    contact?.email,
    contact?.phone,
    contact?.notes,
  ].some(Boolean);

  return (
    <section>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          Private contact
          <span className="text-muted-foreground inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-normal tracking-normal normal-case">
            <Lock className="size-2.5" />
            Admin only
          </span>
        </h3>
        {!editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setEditing(true)}
          >
            {hasContact ? (
              <Pencil className="size-3.5" />
            ) : (
              <Plus className="size-3.5" />
            )}
            {hasContact ? "Edit" : "Add"}
          </Button>
        ) : null}
      </div>

      {editing ? (
        <div className="pt-2">
          <PrivateContactForm
            shopId={row.shopId!}
            initial={
              contact
                ? {
                    name: contact.name,
                    email: contact.email,
                    phone: contact.phone,
                    notes: contact.notes,
                  }
                : null
            }
            onSaved={() => setEditing(false)}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : contact && hasContact ? (
        <div>
          <div className="divide-y">
            {contact.name ? (
              <DetailRow icon={UserRound} label="Name">
                {contact.name}
              </DetailRow>
            ) : null}
            {contact.email ? (
              <DetailRow
                icon={Mail}
                label="Email"
                copyValue={contact.email}
                copyLabel="private email"
              >
                <a
                  href={`mailto:${contact.email}`}
                  className="underline-offset-4 hover:underline"
                >
                  {contact.email}
                </a>
              </DetailRow>
            ) : null}
            {contact.phone ? (
              <DetailRow
                icon={Phone}
                label="Phone"
                copyValue={contact.phone}
                copyLabel="private phone"
              >
                <a
                  href={`tel:${contact.phone}`}
                  className="underline-offset-4 hover:underline"
                >
                  {contact.phone}
                </a>
              </DetailRow>
            ) : null}
            {contact.notes ? (
              <DetailRow icon={NotebookText} label="Notes">
                <p className="whitespace-pre-wrap">{contact.notes}</p>
              </DetailRow>
            ) : null}
          </div>
          <p className="text-muted-foreground pt-1 text-xs">
            Updated {new Date(contact.updatedAt).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground py-2 text-sm">
          No private contact yet.
        </p>
      )}
    </section>
  );
}

function SheetBody({ row }: { row: DirectoryRow }) {
  const router = useRouter();
  const isShop = row.kind === "shop";
  const displayName = row.shopName ?? row.contactName;
  const emailsMatch =
    row.shopEmail !== null &&
    row.accountEmail !== null &&
    row.shopEmail.toLowerCase() === row.accountEmail.toLowerCase();
  const addressLines = row.address ? formatAddress(row.address) : [];
  const fullAddress = addressLines.join("\n");

  // The public section only lists what the storefront shows. The owner's
  // account email isn't public, so for shops it lives under Details instead.
  const emailEntries: { label: string; value: string }[] = [];
  if (isShop) {
    if (row.shopEmail)
      emailEntries.push({ label: "Shop email", value: row.shopEmail });
  } else if (row.accountEmail) {
    emailEntries.push({ label: "Account email", value: row.accountEmail });
  }
  const ownerAccount =
    isShop && row.accountEmail
      ? row.managedByAdmin
        ? {
            label: "Owner account (admin)",
            value: row.accountEmail,
            hint: "This shop is managed by an admin — this isn't the artisan's email.",
          }
        : {
            label: emailsMatch ? "Owner account (same as shop)" : "Owner account",
            value: row.accountEmail,
            hint: undefined,
          }
      : null;

  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-center gap-3 pr-8">
          <Avatar size="lg" className="size-12">
            {row.logoPhoto ? (
              <AvatarImage src={row.logoPhoto} alt={displayName || "Logo"} />
            ) : null}
            <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            {isShop ? (
              <SheetTitle className="truncate text-base">
                {row.shopName ?? "Unnamed shop"}
              </SheetTitle>
            ) : (
              <SheetTitle className="flex flex-wrap items-center gap-2 text-base">
                <Badge variant="secondary">No shop yet</Badge>
              </SheetTitle>
            )}
            <SheetDescription className="truncate">
              {row.contactName || "No contact name"}
            </SheetDescription>
            {row.managedByAdmin ? (
              <Badge
                variant="outline"
                className="border-amber-300 px-1.5 py-0 text-[10px] font-normal text-amber-700 dark:border-amber-700 dark:text-amber-400"
              >
                Managed by admin
              </Badge>
            ) : null}
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-2">
        {isShop && row.shopId ? <PrivateContactSection row={row} /> : null}

        <section>
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {isShop ? "Public contact (shown on storefront)" : "Contact"}
          </h3>
          <div className="divide-y">
            {emailEntries.length > 0 ? (
              emailEntries.map((entry) => (
                <DetailRow
                  key={entry.label}
                  icon={Mail}
                  label={entry.label}
                  copyValue={entry.value}
                  copyLabel={entry.label.toLowerCase()}
                >
                  <a
                    href={`mailto:${entry.value}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {entry.value}
                  </a>
                </DetailRow>
              ))
            ) : (
              <DetailRow icon={Mail} label="Email">
                <Missing />
              </DetailRow>
            )}

            <DetailRow
              icon={Phone}
              label="Phone"
              copyValue={row.phone ?? undefined}
              copyLabel="phone"
            >
              {row.phone ? (
                <a
                  href={`tel:${row.phone}`}
                  className="underline-offset-4 hover:underline"
                >
                  {row.phone}
                </a>
              ) : (
                <Missing />
              )}
            </DetailRow>

            <DetailRow
              icon={Globe}
              label="Website"
              copyValue={row.website ?? undefined}
              copyLabel="website"
            >
              {row.website ? (
                <a
                  href={normalizeWebsite(row.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  {row.website}
                  <ExternalLink className="text-muted-foreground size-3 shrink-0" />
                </a>
              ) : (
                <Missing />
              )}
            </DetailRow>
          </div>
        </section>

        <section>
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Address
          </h3>
          <DetailRow
            icon={MapPin}
            label="Mailing address"
            copyValue={fullAddress || undefined}
            copyLabel="address"
          >
            {addressLines.length > 0 ? (
              <address className="not-italic">
                {addressLines.map((line, i) => (
                  <div key={`${i}-${line}`}>{line}</div>
                ))}
              </address>
            ) : (
              <span className="text-muted-foreground">No address on file</span>
            )}
          </DetailRow>
        </section>

        <section>
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Details
          </h3>
          <div className="divide-y">
            {isShop ? (
              <DetailRow icon={Store} label="Visibility">
                <Badge variant={row.isPublic ? "default" : "outline"}>
                  {row.isPublic ? "Public" : "Hidden"}
                </Badge>
              </DetailRow>
            ) : null}
            {ownerAccount ? (
              <DetailRow
                icon={Mail}
                label={ownerAccount.label}
                copyValue={ownerAccount.value}
                copyLabel="owner account email"
                hint={ownerAccount.hint}
              >
                <a
                  href={`mailto:${ownerAccount.value}`}
                  className="underline-offset-4 hover:underline"
                >
                  {ownerAccount.value}
                </a>
              </DetailRow>
            ) : null}
            <DetailRow icon={ShieldCheck} label="Owner role">
              <span className="capitalize">
                {row.owner.role.toLowerCase().replace(/_/g, " ")}
              </span>
            </DetailRow>
            <DetailRow icon={UserRound} label="Account name">
              {row.owner.name ?? <Missing />}
            </DetailRow>
            <DetailRow icon={CalendarDays} label="Joined">
              {new Date(row.createdAt).toLocaleDateString()}
            </DetailRow>
          </div>
        </section>
      </div>

      <SheetFooter className="border-t">
        {row.contactEmail ? (
          <Button asChild>
            <a href={`mailto:${row.contactEmail}`}>
              <Mail className="size-4" />
              Email
            </a>
          </Button>
        ) : (
          <Button disabled>
            <Mail className="size-4" />
            Email
          </Button>
        )}
        {row.kind === "shop" && row.shopId && row.managedByAdmin ? (
          row.pendingInvite ? (
            <p className="text-muted-foreground text-xs">
              Invite pending to {row.pendingInvite.email} · expires{" "}
              {new Date(row.pendingInvite.expiresAt).toLocaleDateString()}
            </p>
          ) : (
            <SendInviteDialog
              defaultShopId={row.shopId}
              defaultEmail={row.privateContact?.email ?? row.shopEmail ?? ""}
              trigger={
                <Button variant="outline">
                  <UserPlus className="size-4" />
                  Invite to claim shop
                </Button>
              }
              onSent={() => router.refresh()}
            />
          )
        ) : null}
        {isShop && row.shopId ? (
          <Button variant="outline" asChild>
            <Link href={`/admin/shops/${row.shopId}`}>
              <Store className="size-4" />
              Open shop admin
            </Link>
          </Button>
        ) : null}
        <Button variant="outline" asChild>
          <Link href={`/admin/users/${row.owner.id}`}>
            <UserRound className="size-4" />
            View user account
          </Link>
        </Button>
      </SheetFooter>
    </>
  );
}

export function DirectoryDetailSheet({
  row,
  onOpenChange,
}: {
  row: DirectoryRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  // Keep the last row around so content doesn't blank out during the close animation.
  const [lastRow, setLastRow] = useState<DirectoryRow | null>(row);
  if (row !== null && row !== lastRow) setLastRow(row);
  const shown = row ?? lastRow;

  return (
    <Sheet open={row !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-md"
      >
        {shown ? (
          <SheetBody key={shown.id} row={shown} />
        ) : (
          <SheetHeader>
            <SheetTitle>Artisan details</SheetTitle>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}
