"use client";

import { useId } from "react";
import { Handshake } from "lucide-react";

import type { ActiveFilterChip } from "./filter-checklist";
import type { CollaborationTag } from "~/lib/constants/collaboration-tags";
import { COLLABORATION_TAGS } from "~/lib/constants/collaboration-tags";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";

import { FilterChecklist } from "./filter-checklist";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CollabFilterProps = {
  /** Only shops open to collaborate. */
  collab: boolean;
  onCollabChange: (on: boolean) => void;
  /** Shops open to collaborate under the other filters. */
  collabCount: number;
  offers: CollaborationTag[];
  onToggleOffer: (tag: CollaborationTag, checked: boolean) => void;
  offerCounts: Map<CollaborationTag, number>;
  needs: CollaborationTag[];
  onToggleNeed: (tag: CollaborationTag, checked: boolean) => void;
  needCounts: Map<CollaborationTag, number>;
};

/** How many collaboration filters are on, for badges. */
export function activeCollabCount({
  collab,
  offers,
  needs,
}: Pick<CollabFilterProps, "collab" | "offers" | "needs">) {
  return (collab ? 1 : 0) + offers.length + needs.length;
}

/** Removable chips for the active collaboration filters. */
export function collabFilterChips({
  collab,
  onCollabChange,
  offers,
  onToggleOffer,
  needs,
  onToggleNeed,
}: Pick<
  CollabFilterProps,
  | "collab"
  | "onCollabChange"
  | "offers"
  | "onToggleOffer"
  | "needs"
  | "onToggleNeed"
>): ActiveFilterChip[] {
  return [
    ...(collab
      ? [
          {
            key: "collab",
            label: "Open to collaborate",
            onRemove: () => onCollabChange(false),
          },
        ]
      : []),
    ...offers.map((tag) => ({
      key: `offer:${tag}`,
      label: `Offers: ${tag}`,
      onRemove: () => onToggleOffer(tag, false),
    })),
    ...needs.map((tag) => ({
      key: `need:${tag}`,
      label: `Looking for: ${tag}`,
      onRemove: () => onToggleNeed(tag, false),
    })),
  ];
}

// ---------------------------------------------------------------------------
// Panel (popover body and mobile drawer section)
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: string }) {
  return (
    <h3 className="text-muted-foreground px-2 pt-3 pb-1 text-xs font-semibold tracking-wide uppercase">
      {children}
    </h3>
  );
}

export function CollabFilterPanel({
  collab,
  onCollabChange,
  collabCount,
  offers,
  onToggleOffer,
  offerCounts,
  needs,
  onToggleNeed,
  needCounts,
}: CollabFilterProps) {
  const uid = useId();
  const switchId = `${uid}-collab`;
  const hintId = `${uid}-collab-hint`;
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Label htmlFor={switchId} className="text-sm">
            Open to collaborate
          </Label>
          <p id={hintId} className="text-muted-foreground text-xs">
            Artisans sharing what they can offer or need
          </p>
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">
          {collabCount}
        </span>
        <Switch
          id={switchId}
          aria-describedby={hintId}
          checked={collab}
          onCheckedChange={onCollabChange}
        />
      </div>
      <Separator className="my-1" />
      <SectionHeading>Can offer</SectionHeading>
      <FilterChecklist
        label="Can offer"
        options={COLLABORATION_TAGS}
        selected={offers}
        onToggle={onToggleOffer}
        counts={offerCounts}
      />
      <SectionHeading>Looking for</SectionHeading>
      <FilterChecklist
        label="Looking for"
        options={COLLABORATION_TAGS}
        selected={needs}
        onToggle={onToggleNeed}
        counts={needCounts}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Popover (desktop sidebar)
// ---------------------------------------------------------------------------

export function CollabFilter(props: CollabFilterProps) {
  const active = activeCollabCount(props);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={
            active > 0
              ? `Filter by collaboration, ${active} selected`
              : "Filter by collaboration"
          }
        >
          <Handshake aria-hidden />
          Collaborate
          {active > 0 && (
            <Badge className="ml-0.5 h-5 min-w-5 px-1.5">{active}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[min(32rem,var(--radix-popover-content-available-height))] w-80 overflow-y-auto p-2"
      >
        <p className="text-muted-foreground px-2 pt-1 pb-1 text-xs">
          Find artisans to share resources with. Within a list, any tag matches.
        </p>
        <CollabFilterPanel {...props} />
      </PopoverContent>
    </Popover>
  );
}
