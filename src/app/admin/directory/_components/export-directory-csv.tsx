"use client";

import { Download } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

import type { DirectoryRow } from "~/server/api/routers/shops";
import { Button } from "~/components/ui/button";

const FIELDS = [
  "Shop",
  "Owner",
  "Contact Email",
  "Shop Email",
  "Account Email",
  "Phone",
  "Private Name",
  "Private Email",
  "Private Phone",
  "Notes",
  "Managed By Admin",
  "Pending Invite",
  "Website",
  "Street",
  "Additional",
  "City",
  "State",
  "Zip",
  "Country",
  "Public",
  "Type",
  "Joined",
];

function toCsvRow(row: DirectoryRow): string[] {
  const address = row.address;
  return [
    row.shopName ?? "",
    row.contactName ?? "",
    row.contactEmail ?? "",
    row.shopEmail ?? "",
    row.accountEmail ?? "",
    row.contactPhone ?? "",
    row.privateContact?.name ?? "",
    row.privateContact?.email ?? "",
    row.privateContact?.phone ?? "",
    row.privateContact?.notes ?? "",
    row.managedByAdmin ? "Yes" : "No",
    row.pendingInvite?.email ?? "",
    row.website ?? "",
    address?.street ?? address?.address ?? "",
    address?.additional ?? "",
    address?.city ?? "",
    address?.state ?? "",
    address?.zip ?? "",
    address?.country ?? "",
    row.isPublic === null ? "" : row.isPublic ? "Yes" : "No",
    row.kind === "shop" ? "Shop" : "No shop yet",
    new Date(row.createdAt).toISOString().slice(0, 10),
  ];
}

export function ExportDirectoryCsv({
  getRows,
}: {
  getRows: () => DirectoryRow[];
}) {
  const handleExport = () => {
    const rows = getRows();
    if (rows.length === 0) {
      toast.info("Nothing to export");
      return;
    }

    const csv = Papa.unparse({ fields: FIELDS, data: rows.map(toCsvRow) });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `artisan-directory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(
      `Exported ${rows.length} ${rows.length === 1 ? "row" : "rows"}`,
    );
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      className="gap-2"
    >
      <Download className="size-4" />
      Export CSV
    </Button>
  );
}
