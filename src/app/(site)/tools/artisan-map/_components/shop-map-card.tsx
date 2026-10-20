"use client";

import type { KeyboardEvent } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  Mail,
  MapPin,
  Phone,
  Store,
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { MapShop } from "../_lib/types";
import { shopPath } from "~/lib/seo/paths";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { OutboundLink } from "~/components/outbound-link";

import { ShopAvatar } from "./shop-avatar";

/** Prefix bare domains with https://; drop anything that isn't http(s). */
export function normalizeWebsite(raw: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  // Refuse other schemes (javascript:, data:, ...); bare `host:port` is fine.
  if (/^(javascript|data|vbscript|file):/i.test(value)) return null;
  return `https://${value}`;
}

function blankToNull(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

function phoneHref(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  return digits.replace(/\+/g, "").length > 0 ? `tel:${digits}` : null;
}

/** Cycles through the shops that share one map pin. `index` is zero-based. */
export type ShopMapCardPager = {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

type ShopMapCardProps = {
  shop: MapShop;
  onClose?: () => void;
  /** Set when other shops share this pin; adds a "1 of N" strip at the bottom. */
  pager?: ShopMapCardPager;
  className?: string;
};

export function ShopMapCard({
  shop,
  onClose,
  pager,
  className,
}: ShopMapCardProps) {
  const website = normalizeWebsite(shop.website);
  const email = blankToNull(shop.email);
  const phone = blankToNull(shop.phone);
  const telHref = phone ? phoneHref(phone) : null;
  const showOwner =
    !!shop.ownerName &&
    shop.ownerName.trim().toLowerCase() !== shop.name.trim().toLowerCase();

  const copyLink = async () => {
    const url = `${window.location.origin}/tools/artisan-map?shop=${encodeURIComponent(shop.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const handlePagerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!pager) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      pager.onPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      pager.onNext();
    }
  };

  return (
    <article
      aria-label={shop.name}
      className={cn(
        "bg-card text-card-foreground relative flex w-full flex-col gap-3 rounded-xl border p-4 text-left shadow-lg",
        className,
      )}
    >
      <header className="flex items-center gap-3">
        <ShopAvatar shop={shop} size={56} />
        <div className={cn("flex min-w-0 flex-1 flex-col", onClose && "pr-6")}>
          <h3 className="line-clamp-2 text-base leading-snug font-semibold text-balance">
            {shop.name}
          </h3>
          {showOwner && (
            <p className="text-muted-foreground truncate text-sm">
              {shop.ownerName}
            </p>
          )}
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Close"
            onClick={onClose}
            className="text-muted-foreground absolute top-2 right-2 size-7"
          >
            <X className="size-4" aria-hidden />
          </Button>
        )}
      </header>

      {shop.precision === "exact" && shop.streetAddress ? (
        // Storefronts are public places, pinned at their street address.
        <p className="text-muted-foreground flex items-start gap-1.5 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="min-w-0">
            <span className="block truncate">{shop.streetAddress}</span>
            {shop.locality && (
              <span className="block truncate">{shop.locality}</span>
            )}
          </span>
        </p>
      ) : (
        shop.locality && (
          <p
            className="text-muted-foreground flex items-center gap-1.5 text-sm"
            title="The pin marks the general area, never a home address."
          >
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              <span className="text-muted-foreground/70">
                Approximate area ·{" "}
              </span>
              {shop.locality}
            </span>
          </p>
        )
      )}

      {shop.attributeTags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Attributes">
          {shop.attributeTags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary">{tag}</Badge>
            </li>
          ))}
        </ul>
      )}

      {(email ?? phone) && (
        <div className="flex flex-col gap-1.5 text-sm">
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-foreground hover:text-primary focus-visible:ring-ring/50 flex min-w-0 items-center gap-1.5 rounded-sm outline-none hover:underline focus-visible:ring-[3px]"
            >
              <Mail
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden
              />
              <span className="truncate">{email}</span>
            </a>
          )}
          {phone &&
            (telHref ? (
              <a
                href={telHref}
                className="text-foreground hover:text-primary focus-visible:ring-ring/50 flex min-w-0 items-center gap-1.5 rounded-sm outline-none hover:underline focus-visible:ring-[3px]"
              >
                <Phone
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
                <span className="truncate">{phone}</span>
              </a>
            ) : (
              <span className="flex min-w-0 items-center gap-1.5">
                <Phone
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
                <span className="truncate">{phone}</span>
              </span>
            ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        {website && (
          <Button asChild variant="outline" size="sm" className="flex-1">
            <OutboundLink
              href={website}
              track={{
                shopId: shop.id,
                target: "WEBSITE",
                source: "ARTISAN_MAP",
              }}
            >
              Website
              <ExternalLink aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </OutboundLink>
          </Button>
        )}
        <Button asChild size="sm" className="flex-1">
          <Link href={shopPath(shop)}>View profile</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Copy link to ${shop.name} on the map`}
          title="Copy link"
          onClick={() => void copyLink()}
        >
          <Link2 aria-hidden />
        </Button>
      </div>

      {pager && (
        // Footer, not header: the popup sits above the pin and the mobile
        // sheet at the screen bottom, so the card's bottom edge stays put
        // while its height changes from shop to shop and the arrows don't
        // move under the pointer. Negative margins bleed it to the card edge.
        <div
          role="group"
          aria-label="Shops at this location"
          onKeyDown={handlePagerKeyDown}
          className="-mx-4 -mb-4 flex items-center gap-1 border-t py-1.5 pr-2 pl-4"
        >
          <p className="text-muted-foreground flex min-w-0 flex-1 items-center gap-1.5 text-xs">
            <Store className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {pager.total} shops at this location
            </span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Previous shop at this location"
            onClick={pager.onPrev}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <span
            aria-live="polite"
            className="text-muted-foreground text-xs tabular-nums"
          >
            {pager.index + 1} of {pager.total}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Next shop at this location"
            onClick={pager.onNext}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      )}
    </article>
  );
}
