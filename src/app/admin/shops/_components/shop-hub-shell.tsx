"use client";

import { createContext, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

type ShopHubSlots = {
  /** Toolbar element next to the title, for a Saved/Unsaved badge. */
  status: HTMLElement | null;
  /** Toolbar element after View shop, for page actions (Save, Delete...). */
  actions: HTMLElement | null;
  /** Toggles the toolbar's unsaved-changes shadow. */
  setDirty: (dirty: boolean) => void;
};

const ShopHubContext = createContext<ShopHubSlots | null>(null);

/**
 * Toolbar slots for whatever page renders inside the shell. The elements are
 * null until the toolbar mounts, so portal into them only once they're set.
 */
export function useShopHubSlots() {
  const context = useContext(ShopHubContext);
  if (!context) {
    throw new Error("useShopHubSlots must be used inside <ShopHubShell>.");
  }
  return context;
}

type Props = {
  title: string;
  /** Public shop URL; omitted for a shop that doesn't exist yet. */
  viewHref?: string;
  isPublic?: boolean;
  /** Admins: who owns the shop, with a way to change it. */
  ownerChip?: React.ReactNode;
  /** Sub-page links (Details, Products, ...). */
  nav?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Sticky toolbar and page container shared by a shop's admin pages. Pages
 * fill the status and actions slots via `useShopHubSlots` + `createPortal`,
 * so their state stays local while the toolbar survives sub-page navigation.
 */
export function ShopHubShell({
  title,
  viewHref,
  isPublic,
  ownerChip,
  nav,
  children,
}: Props) {
  // useState (not useRef) so consumers re-render once the slots mount.
  const [status, setStatus] = useState<HTMLElement | null>(null);
  const [actions, setActions] = useState<HTMLElement | null>(null);
  const [dirty, setDirty] = useState(false);

  const slots = useMemo(
    () => ({ status, actions, setDirty }),
    [status, actions],
  );

  return (
    <ShopHubContext.Provider value={slots}>
      <div className="min-h-screen">
        <div className={cn("admin-form-toolbar", dirty ? "dirty" : "")}>
          <div className="toolbar-info">
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/admin/shops">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="bg-border hidden h-6 w-px shrink-0 sm:block" />
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <h1 className="truncate text-base font-medium">{title}</h1>
              <span ref={setStatus} className="contents" />
            </div>
            {ownerChip && (
              <>
                <div className="bg-border hidden h-6 w-px shrink-0 xl:block" />
                <div className="hidden min-w-0 xl:flex">{ownerChip}</div>
              </>
            )}
          </div>

          <div className="toolbar-actions">
            {viewHref && (
              <Button
                variant="outline"
                size="sm"
                asChild
                aria-label={isPublic ? "View shop" : "Preview shop"}
              >
                <Link href={viewHref} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {isPublic ? "View shop" : "Preview shop"}
                  </span>
                </Link>
              </Button>
            )}
            <div ref={setActions} className="contents" />
          </div>
        </div>

        <div className="admin-container w-full space-y-6">
          {nav}
          {children}
        </div>
      </div>
    </ShopHubContext.Provider>
  );
}
