"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  copyValue?: string;
  copyLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className="text-sm break-words">{children}</div>
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

function SheetBody({ row }: { row: DirectoryRow }) {
  const isShop = row.kind === "shop";
  const displayName = row.shopName ?? row.contactName;
  const emailsMatch =
    row.shopEmail !== null &&
    row.accountEmail !== null &&
    row.shopEmail.toLowerCase() === row.accountEmail.toLowerCase();
  const addressLines = row.address ? formatAddress(row.address) : [];
  const fullAddress = addressLines.join("\n");

  const emailEntries: { label: string; value: string }[] = [];
  if (emailsMatch && row.shopEmail) {
    emailEntries.push({ label: "Email", value: row.shopEmail });
  } else {
    if (row.shopEmail)
      emailEntries.push({ label: "Shop email", value: row.shopEmail });
    if (row.accountEmail)
      emailEntries.push({ label: "Account email", value: row.accountEmail });
  }

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
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-2">
        <section>
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Contact
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
          <SheetBody row={shown} />
        ) : (
          <SheetHeader>
            <SheetTitle>Artisan details</SheetTitle>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}
