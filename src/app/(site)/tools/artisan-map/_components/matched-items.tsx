"use client";

import Link from "next/link";

import type { MapShop } from "../_lib/types";
import type {
  MapMatchedItem,
  MapShopMatch,
} from "~/lib/search/map-listing-types";
import { shopPath } from "~/lib/seo/paths";
import { cn } from "~/lib/utils";

/** Items listed per shop before "+N more". */
const VISIBLE_ITEMS = 3;

export type OpenMatchedItem = (item: MapMatchedItem, shop: MapShop) => void;

export type MatchedItemsProps = {
  shop: MapShop;
  match: MapShopMatch;
  /** The category being browsed, when there is no text search. */
  browseCategory: string | null;
  onOpenItem: OpenMatchedItem;
  className?: string;
};

/**
 * What a shop matched on: its items, or a note that only its profile did. A
 * sibling of the sidebar's row button, never inside it, since buttons can't nest.
 */
export function MatchedItems({
  shop,
  match,
  browseCategory,
  onOpenItem,
  className,
}: MatchedItemsProps) {
  if (match.total === 0) {
    if (match.shopMatch !== "profile") return null;
    return (
      <p className={cn("text-muted-foreground text-xs", className)}>
        Mentioned in their shop profile
      </p>
    );
  }

  const shown = match.items.slice(0, VISIBLE_ITEMS);
  const more = match.total - shown.length;

  return (
    <div className={cn("flex flex-col", className)}>
      <p className="text-muted-foreground text-xs">
        {browseCategory
          ? `${match.total} in ${browseCategory}`
          : `${match.total} ${match.total === 1 ? "match" : "matches"}`}
      </p>
      <ul className="-mx-1.5 flex flex-col">
        {shown.map((item) => (
          <li key={`${item.kind}:${item.id}`}>
            <button
              type="button"
              title={item.name}
              onClick={() => onOpenItem(item, shop)}
              className="hover:bg-foreground/10 focus-visible:ring-ring/50 flex min-h-8 w-full items-center rounded-md px-1.5 text-left text-xs transition-colors outline-none focus-visible:ring-[3px]"
            >
              <span className="sr-only">View details for </span>
              <span className="truncate">{item.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {more > 0 && (
        <Link
          href={shopPath(shop)}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex min-h-8 items-center self-start rounded-sm text-xs underline-offset-2 outline-none hover:underline focus-visible:ring-[3px]"
        >
          +{more} more
          <span className="sr-only"> from {shop.name}</span>
        </Link>
      )}
    </div>
  );
}
