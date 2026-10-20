"use client";

import { Copy, Mail, XIcon } from "lucide-react";
import { toast } from "sonner";

import type { DirectoryRow } from "~/server/api/routers/shops";
import { Button } from "~/components/ui/button";

const MAX_MAILTO_LENGTH = 1800;

function uniqueEmails(rows: DirectoryRow[]) {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const row of rows) {
    const email = row.contactEmail?.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    emails.push(email);
  }
  return emails;
}

export function DirectoryBulkActions({
  rows,
  onClear,
}: {
  rows: DirectoryRow[];
  onClear: () => void;
}) {
  const emails = uniqueEmails(rows);
  const withoutEmail = rows.filter((row) => !row.contactEmail?.trim()).length;
  const disabled = emails.length === 0;

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      return true;
    } catch {
      return false;
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await copyEmails()) {
      toast.success(
        `Copied ${emails.length} email${emails.length === 1 ? "" : "s"}`,
      );
    } else {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const handleBcc = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `mailto:?bcc=${emails.map(encodeURIComponent).join(",")}`;

    if (url.length > MAX_MAILTO_LENGTH) {
      if (await copyEmails()) {
        toast.warning(
          "Too many recipients for a mail link — copied the emails instead. Paste them into BCC.",
        );
      } else {
        toast.error("Too many recipients for a mail link, and copying failed.");
      }
      return;
    }

    window.location.href = url;
  };

  return (
    <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
      <span className="text-muted-foreground text-sm font-medium">
        {rows.length} selected
      </span>

      <div className="bg-border h-4 w-px" />

      <Button
        variant="outline"
        className="h-8 text-xs lg:px-3"
        disabled={disabled}
        onClick={(e) => void handleCopy(e)}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy {emails.length} emails
      </Button>

      <Button
        className="h-8 text-xs lg:px-3"
        disabled={disabled}
        onClick={(e) => void handleBcc(e)}
      >
        <Mail className="mr-2 h-4 w-4" />
        Email {emails.length} (BCC)
      </Button>

      {withoutEmail > 0 ? (
        <span className="text-muted-foreground text-xs">
          {withoutEmail} without email
        </span>
      ) : null}

      <div className="bg-border h-4 w-px" />

      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
      >
        <XIcon className="mr-1 h-4 w-4" />
        Clear
      </Button>
    </div>
  );
}
