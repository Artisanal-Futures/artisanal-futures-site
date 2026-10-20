"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { cn } from "~/lib/utils";

const SECTIONS = [
  { segment: null, label: "Details" },
  { segment: "products", label: "Products" },
  { segment: "services", label: "Services" },
  { segment: "sync", label: "Sync" },
] as const;

type Props = {
  shopId: string;
};

/**
 * Route-based sub-navigation for a shop's admin pages. Plain links (not
 * Radix Tabs) so each section is its own URL and `useDirtyForm` can warn
 * before leaving unsaved details.
 */
export function ShopHubNav({ shopId }: Props) {
  // null on the [id] page itself (Details).
  const activeSegment = useSelectedLayoutSegment();

  return (
    <nav
      aria-label="Shop sections"
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex w-max min-w-full gap-1 border-b">
        {SECTIONS.map(({ segment, label }) => {
          const isActive = segment === activeSegment;
          const href = segment
            ? `/admin/shops/${shopId}/${segment}`
            : `/admin/shops/${shopId}`;

          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-10 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors",
                  "focus-visible:ring-ring/50 rounded-t-md outline-none focus-visible:ring-[3px]",
                  isActive
                    ? "border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:border-border border-transparent",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
