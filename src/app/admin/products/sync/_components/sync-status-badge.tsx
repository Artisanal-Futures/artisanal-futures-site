import { Badge } from "~/components/ui/badge";

/**
 * Shared status pill for sync runs. Colours follow the admin palette already
 * used by `.admin-status-badge` (green = good, amber = needs you, red = broken).
 */
const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING_REVIEW: {
    label: "Needs review",
    className:
      "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20",
  },
  RUNNING: {
    label: "Running",
    className:
      "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20",
  },
  EMPTY: {
    label: "Up to date",
    className:
      "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20",
  },
  APPLIED: {
    label: "Applied",
    className:
      "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20",
  },
  FAILED: {
    label: "Failed",
    className:
      "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
  },
  DISCARDED: {
    label: "Discarded",
    className:
      "bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20",
  },
};

export function SyncStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={`border-0 ${style.className}`}>
      {style.label}
    </Badge>
  );
}
