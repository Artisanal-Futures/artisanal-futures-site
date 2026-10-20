"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  MapPin,
  MapPinOff,
  Navigation,
  Package,
  SearchIcon,
  SlidersHorizontal,
  Store,
  X,
} from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import type { MapShop } from "../_lib/types";
import { STORE_ATTRIBUTES } from "~/lib/constants/store-attributes";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Toggle } from "~/components/ui/toggle";

import { formatDistance } from "../_lib/map-stats";
import { ShopAvatar } from "./shop-avatar";
import { ShopMapCard } from "./shop-map-card";

// ---------------------------------------------------------------------------
// Search box (300ms debounce, mirrors the shops directory filter)
// ---------------------------------------------------------------------------

type SearchBoxProps = {
  /** Committed query (from the URL). */
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SearchBox({ value, onChange, className }: SearchBoxProps) {
  const [text, setText] = useState(value);
  const lastCommitted = useRef(value);

  const commit = useDebouncedCallback((next: string) => {
    lastCommitted.current = next.trim();
    onChange(next.trim());
  }, 300);

  // Follow external changes (Clear filters, the other search box) but never
  // overwrite what the user is typing.
  useEffect(() => {
    if (value === lastCommitted.current) return;
    lastCommitted.current = value;
    commit.cancel();
    setText(value);
  }, [value, commit]);

  const clear = () => {
    commit.cancel();
    setText("");
    lastCommitted.current = "";
    onChange("");
  };

  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <SearchIcon className="size-4" aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label="Search artisans by name, place, or tag"
        placeholder="Search name, place, or tag…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        className="[&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            aria-label="Clear search"
            onClick={clear}
          >
            <X className="size-4" aria-hidden />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

// ---------------------------------------------------------------------------
// Attribute filter
// ---------------------------------------------------------------------------

type AttributeProps = {
  selected: string[];
  onToggle: (attribute: string, checked: boolean) => void;
  /** Matches per attribute under the other active filters. */
  counts?: Map<string, number>;
};

export function AttributeChecklist({
  selected,
  onToggle,
  counts,
}: AttributeProps) {
  const uid = useId();
  return (
    <div className="flex flex-col gap-1">
      {STORE_ATTRIBUTES.map((attribute, i) => {
        const id = `${uid}-${i}`;
        const isSelected = selected.includes(attribute);
        const count = counts?.get(attribute);
        return (
          <div
            key={attribute}
            className="hover:bg-accent flex items-center gap-2.5 rounded-md px-2 py-2"
          >
            <Checkbox
              id={id}
              checked={isSelected}
              onCheckedChange={(checked) =>
                onToggle(attribute, checked === true)
              }
            />
            <Label
              htmlFor={id}
              className={cn(
                "flex-1 cursor-pointer text-sm",
                count === 0 && !isSelected && "opacity-60",
              )}
            >
              {attribute}
            </Label>
            {count !== undefined && (
              <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AttributeFilter({ selected, onToggle, counts }: AttributeProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={
            selected.length > 0
              ? `Filter by attribute, ${selected.length} selected`
              : "Filter by attribute"
          }
        >
          <SlidersHorizontal aria-hidden />
          Attributes
          {selected.length > 0 && (
            <Badge className="ml-0.5 h-5 min-w-5 px-1.5">
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <p className="text-muted-foreground px-2 pt-1 pb-2 text-xs">
          Show artisans with any of these
        </p>
        <AttributeChecklist
          selected={selected}
          onToggle={onToggle}
          counts={counts}
        />
      </PopoverContent>
    </Popover>
  );
}

export function ActiveAttributeChips({ selected, onToggle }: AttributeProps) {
  if (selected.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Active filters">
      {selected.map((attribute) => (
        <li key={attribute}>
          <Badge variant="secondary" className="gap-0.5 pr-0.5">
            {attribute}
            <button
              type="button"
              aria-label={`Remove filter: ${attribute}`}
              onClick={() => onToggle(attribute, false)}
              className="hover:bg-foreground/10 focus-visible:ring-ring/50 inline-flex size-4 items-center justify-center rounded-full outline-none focus-visible:ring-[3px]"
            >
              <X className="size-3" aria-hidden />
            </button>
          </Badge>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export type MapSidebarProps = {
  /** Shops after search/attribute filtering. */
  shops: MapShop[];
  totalCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  attributes: string[];
  onToggleAttribute: AttributeProps["onToggle"];
  /** Only show storefronts pinned at a public street address. */
  inPerson: boolean;
  onInPersonChange: (on: boolean) => void;
  /** Per-attribute facet counts (ignoring the attribute filter itself). */
  attributeCounts?: Map<string, number>;
  /** Miles from the user, keyed by shop id; null until "Near me" is used. */
  distances?: Map<string, number> | null;
  hasFilters: boolean;
  onClearFilters: () => void;
  selectedShopId: string | null;
  hoveredShopId: string | null;
  onSelectShop: (id: string | null) => void;
  onHoverShop: (id: string | null) => void;
  /** Hide the search box + attribute controls (mobile has its own). */
  hideControls?: boolean;
  /** Expand the card inline under a selected shop that has no location. */
  inlineCard?: boolean;
  /** Clicking the selected item again deselects it. */
  toggleSelected?: boolean;
  className?: string;
};

export function MapSidebar({
  shops,
  totalCount,
  query,
  onQueryChange,
  attributes,
  onToggleAttribute,
  inPerson,
  onInPersonChange,
  attributeCounts,
  distances,
  hasFilters,
  onClearFilters,
  selectedShopId,
  hoveredShopId,
  onSelectShop,
  onHoverShop,
  hideControls = false,
  inlineCard = false,
  toggleSelected = false,
  className,
}: MapSidebarProps) {
  const located = shops.filter((s) => s.location !== null);
  // Nearest-first once the user has shared their location.
  if (distances) {
    located.sort(
      (a, b) =>
        (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity),
    );
  }
  const unlocated = shops.filter((s) => s.location === null);

  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  useEffect(() => {
    if (!selectedShopId) return;
    const el = itemRefs.current.get(selectedShopId);
    if (!el?.offsetParent) return; // not rendered (hidden copy)
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedShopId]);

  const renderItem = (shop: MapShop) => {
    const selected = shop.id === selectedShopId;
    const hovered = shop.id === hoveredShopId;
    const expanded = selected && inlineCard && shop.location === null;
    const showOwner =
      !!shop.ownerName &&
      shop.ownerName.trim().toLowerCase() !== shop.name.trim().toLowerCase();
    const distance = distances?.get(shop.id);
    const meta = [
      shop.productCount > 0
        ? `${shop.productCount} ${shop.productCount === 1 ? "product" : "products"}`
        : null,
      shop.serviceCount > 0
        ? `${shop.serviceCount} ${shop.serviceCount === 1 ? "service" : "services"}`
        : null,
    ].filter(Boolean);
    const approximate = shop.precision === "approximate";
    return (
      <li
        key={shop.id}
        ref={(el) => {
          if (el) itemRefs.current.set(shop.id, el);
          else itemRefs.current.delete(shop.id);
        }}
      >
        <button
          type="button"
          aria-current={selected ? "true" : undefined}
          onClick={() =>
            onSelectShop(selected && toggleSelected ? null : shop.id)
          }
          onMouseEnter={() => onHoverShop(shop.id)}
          onMouseLeave={() => onHoverShop(null)}
          onFocus={() => onHoverShop(shop.id)}
          onBlur={() => onHoverShop(null)}
          className={cn(
            "focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors outline-none focus-visible:ring-[3px]",
            selected
              ? "bg-accent ring-ring/40 ring-1"
              : hovered
                ? "bg-accent/60"
                : "hover:bg-accent/60",
          )}
        >
          <ShopAvatar shop={shop} size={40} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm leading-tight font-medium">
                {shop.name}
              </span>
              {shop.isNew && (
                <Badge className="shrink-0 px-1.5 py-0 text-[10px]">New</Badge>
              )}
            </span>
            {showOwner && (
              <span className="text-muted-foreground truncate text-xs">
                {shop.ownerName}
              </span>
            )}
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                shop.locality
                  ? "text-muted-foreground"
                  : "text-muted-foreground/70",
              )}
            >
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">
                {shop.locality ?? "Location not listed"}
              </span>
            </span>
            {meta.length > 0 && (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Package className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{meta.join(" · ")}</span>
              </span>
            )}
            {shop.attributeTags.length > 0 && (
              <span className="mt-0.5 flex flex-wrap gap-1">
                {shop.attributeTags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="max-w-40 px-1.5 py-0 text-[11px] font-normal"
                  >
                    <span className="truncate">{tag}</span>
                  </Badge>
                ))}
                {shop.attributeTags.length > 2 && (
                  <Badge
                    variant="outline"
                    className="px-1.5 py-0 text-[11px] font-normal"
                  >
                    +{shop.attributeTags.length - 2}
                  </Badge>
                )}
              </span>
            )}
          </span>
          {distance !== undefined && (
            <span
              title={approximate ? "Approximate distance" : undefined}
              className="text-muted-foreground shrink-0 self-start text-xs tabular-nums"
            >
              {formatDistance(distance, approximate)}
            </span>
          )}
        </button>
        {expanded && (
          <div className="px-1 pt-1 pb-2">
            <ShopMapCard shop={shop} onClose={() => onSelectShop(null)} />
          </div>
        )}
      </li>
    );
  };

  const section = (title: string, list: MapShop[], icon: ReactNode) =>
    list.length > 0 && (
      <section aria-label={title} className="flex flex-col gap-1">
        <h2 className="text-muted-foreground flex items-center gap-1.5 px-2.5 pt-3 pb-1 text-xs font-semibold tracking-wide uppercase">
          {icon}
          {title} ({list.length})
        </h2>
        <ul className="flex flex-col gap-0.5">{list.map(renderItem)}</ul>
      </section>
    );

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex shrink-0 flex-col gap-3 border-b p-3">
        {!hideControls && (
          <>
            <SearchBox value={query} onChange={onQueryChange} />
            <div className="flex flex-wrap items-center gap-2">
              <AttributeFilter
                selected={attributes}
                onToggle={onToggleAttribute}
                counts={attributeCounts}
              />
              <Toggle
                variant="outline"
                size="sm"
                pressed={inPerson}
                onPressedChange={onInPersonChange}
                aria-label="Only storefronts you can visit"
                title="Only storefronts you can visit"
                className="gap-1.5 px-2.5"
              >
                <Store aria-hidden />
                Storefronts
              </Toggle>
            </div>
            <ActiveAttributeChips
              selected={attributes}
              onToggle={onToggleAttribute}
            />
          </>
        )}
        <div className="flex items-center justify-between gap-2 text-sm">
          <p className="text-muted-foreground" aria-live="polite">
            {hasFilters
              ? `${shops.length} of ${totalCount} ${totalCount === 1 ? "artisan" : "artisans"}`
              : `${shops.length} ${shops.length === 1 ? "artisan" : "artisans"}`}
          </p>
          {hasFilters && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div
        data-vaul-no-drag
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-4"
      >
        {shops.length === 0 ? (
          <Empty className="px-3 py-10 md:px-3 md:py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPinOff aria-hidden />
              </EmptyMedia>
              <EmptyTitle>
                {totalCount === 0
                  ? "No artisans on the map yet"
                  : "No artisans match these filters"}
              </EmptyTitle>
              <EmptyDescription>
                {totalCount === 0
                  ? "Check back soon as more artisans join the network."
                  : "Try a different search or remove an attribute filter."}
              </EmptyDescription>
            </EmptyHeader>
            {totalCount > 0 && (
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClearFilters}
                >
                  Clear filters
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <>
            {section(
              distances ? "Nearest to you" : "On the map",
              located,
              distances ? (
                <Navigation className="size-3.5" aria-hidden />
              ) : (
                <MapPin className="size-3.5" aria-hidden />
              ),
            )}
            {section(
              "Online / location unknown",
              unlocated,
              <MapPinOff className="size-3.5" aria-hidden />,
            )}
          </>
        )}
      </div>
    </div>
  );
}
