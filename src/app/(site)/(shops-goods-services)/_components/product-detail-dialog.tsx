"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleCheck, Clock, ExternalLink, MapPin, Store } from "lucide-react";

import type { OutboundSource } from "~/lib/analytics/track-outbound";
import type { RouterOutputs } from "~/trpc/react";
import { formatPrice } from "~/lib/format-price";
import { handleImageUrl } from "~/lib/handle-image-url";
import { cn } from "~/lib/utils";
import {
  Dialog,
  DialogContentHighContrast,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ImageWithFallback } from "~/components/image-with-fallback";
import { OutboundLink } from "~/components/outbound-link";

type Product = Omit<
  NonNullable<RouterOutputs["shop"]["get"]>["products"][number],
  "categories"
>;
type Service = Omit<
  NonNullable<RouterOutputs["shop"]["get"]>["services"][number],
  "categories"
>;

type Props = {
  item: Product | Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdBy?: string;
  shopPrinciples?: string[];
  linkToProfile?: string;
  linkToWebsite?: string;
  /** Business logo, shown if the product image fails to load. */
  fallbackImage?: string | null;
  /** For outbound click tracking, when the item itself doesn't carry a shopId. */
  shopId?: string;
  /** Where the dialog was opened from, recorded with outbound clicks. */
  trackingSource: OutboundSource;
};

const removeHtmlTags = (text: string) => {
  return text
    .replace(/<[^>]*>?/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&(#39|apos);/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
};

/** First letters of up to two words, e.g. "Olive Mode Boutique" -> "OM". */
const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

/**
 * Description clamped to a few lines with a "Read more" toggle, shown only
 * when the text actually overflows the clamp.
 */
function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const measure = () => setIsClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    // Re-measure when the dialog resizes (e.g. crossing the sm breakpoint)
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <div className="flex flex-col items-start gap-1">
      <DialogDescription
        ref={ref}
        className={cn(
          "text-foreground/70 text-sm leading-relaxed",
          !expanded && "line-clamp-5",
        )}
      >
        {text}
      </DialogDescription>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="text-foreground text-sm font-medium underline underline-offset-4 hover:no-underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

const primaryButtonClass =
  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors";

export function ProductDetailDialog({
  item,
  open,
  onOpenChange,
  linkToProfile,
  shopPrinciples,
  linkToWebsite,
  createdBy,
  fallbackImage,
  shopId,
  trackingSource,
}: Props) {
  if (!item) return null;

  const hasPrinciples = shopPrinciples && shopPrinciples.length > 0;
  const fallbackSrc =
    fallbackImage?.trim() && fallbackImage !== "null"
      ? fallbackImage.startsWith("http")
        ? fallbackImage
        : handleImageUrl(fallbackImage)
      : undefined;
  const price = formatPrice(item.priceInCents, item.currency);

  // Only services carry these fields (and narrow selects may omit them)
  const isService = "serviceUrl" in item || "durationInMinutes" in item;
  const itemUrl =
    ("productUrl" in item ? item.productUrl : null) ??
    ("serviceUrl" in item ? item.serviceUrl : null) ??
    null;
  const duration = "durationInMinutes" in item ? item.durationInMinutes : null;
  const locationType = "locationType" in item ? item.locationType : null;
  const hasFacts = !!duration || !!locationType;

  // Collections items carry their shopId; the shop profile passes it as a prop
  const itemShopId =
    "shopId" in item && typeof item.shopId === "string" && item.shopId !== ""
      ? item.shopId
      : null;
  const trackedShopId = itemShopId ?? shopId;

  const hasOutboundLink = !!itemUrl || !!linkToWebsite;
  const initials = createdBy ? getInitials(createdBy) : "";
  const showMakerBox =
    !!createdBy || !!hasPrinciples || hasOutboundLink || !!linkToProfile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentHighContrast className="max-h-[90vh] max-w-md gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-3xl sm:overflow-hidden">
        <div className="grid sm:max-h-[min(85vh,34rem)] sm:grid-cols-2">
          {/* Image */}
          {item?.imageUrl ? (
            <div className="bg-muted relative overflow-hidden sm:flex sm:h-full sm:items-center sm:justify-center">
              {/* Ambient backdrop: a small, blurred, scaled-up copy of the
                  photo fills the letterbox above/below the square image so the
                  empty space reads as a glow. scale-125 pushes blur-2xl's
                  transparent edge halo outside the overflow-hidden frame. */}
              <ImageWithFallback
                src={item.imageUrl}
                fallbackSrc={fallbackSrc}
                alt=""
                aria-hidden="true"
                fill
                sizes="128px"
                className="scale-125 object-cover opacity-90 blur-2xl saturate-125"
              />
              <div className="relative aspect-square w-full">
                <ImageWithFallback
                  src={item.imageUrl ?? "/placeholder.svg"}
                  fallbackSrc={fallbackSrc}
                  alt={item?.name ?? ""}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="bg-muted sm:flex sm:h-full sm:items-center sm:justify-center">
              <div className="relative flex aspect-square w-full items-center justify-center">
                {fallbackSrc ? (
                  <ImageWithFallback
                    src={fallbackSrc}
                    alt={createdBy ?? item?.name ?? ""}
                    fill
                    className="object-contain p-12"
                  />
                ) : (
                  <span className="text-muted-foreground/40 text-5xl font-semibold">
                    {initials.length > 0 ? initials : item?.name?.charAt(0)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Content */}

          <div className="flex flex-col gap-3 p-5 sm:h-full sm:overflow-hidden">
            <DialogHeader className="gap-1 pr-6">
              <DialogTitle className="text-xl">{item.name}</DialogTitle>
              {hasOutboundLink &&
                (price !== null ? (
                  <p className="text-foreground/80 text-sm font-medium">
                    {price}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    See price on their site
                  </p>
                ))}
            </DialogHeader>

            {/* Service facts */}
            {hasFacts && (
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                {!!duration && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {duration} min
                  </span>
                )}
                {!!locationType && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {locationType}
                  </span>
                )}
              </div>
            )}

            {/* Description (only this scrolls on desktop, once expanded) */}
            {item.description && (
              <div className="sm:min-h-0 sm:flex-1 sm:overflow-y-auto">
                <ExpandableDescription
                  key={item.id}
                  text={removeHtmlTags(item.description)}
                />
              </div>
            )}

            {/* About the owner */}
            {showMakerBox && (
              <div className="bg-muted mt-auto flex flex-col gap-3 rounded-xl p-3">
                {createdBy && (
                  <div className="flex items-center gap-2.5">
                    <div className="bg-background text-muted-foreground relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold">
                      {fallbackSrc ? (
                        <ImageWithFallback
                          src={fallbackSrc}
                          alt=""
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-muted-foreground text-xs">
                        About the owner
                      </span>
                      <span className="text-sm font-medium">{createdBy}</span>
                    </div>
                  </div>
                )}

                {hasPrinciples && (
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    {shopPrinciples?.map((principle) => (
                      <li key={principle} className="flex items-start gap-1.5">
                        <CircleCheck className="text-primary mt-0.5 size-3.5 shrink-0" />
                        <span>{principle}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {(hasOutboundLink || linkToProfile) && (
                  <div className="flex items-stretch gap-2">
                    {itemUrl ? (
                      <OutboundLink
                        href={itemUrl}
                        className={primaryButtonClass}
                        track={
                          trackedShopId
                            ? {
                                shopId: trackedShopId,
                                productId: isService ? null : item.id,
                                serviceId: isService ? item.id : null,
                                target: isService ? "SERVICE" : "PRODUCT",
                                source: trackingSource,
                              }
                            : null
                        }
                      >
                        {isService ? "Book on their site" : "Buy on their site"}
                        <ExternalLink className="size-3.5" />
                      </OutboundLink>
                    ) : linkToWebsite ? (
                      <OutboundLink
                        href={linkToWebsite}
                        className={primaryButtonClass}
                        track={
                          trackedShopId
                            ? {
                                shopId: trackedShopId,
                                target: "WEBSITE",
                                source: trackingSource,
                              }
                            : null
                        }
                      >
                        Visit their site
                        <ExternalLink className="size-3.5" />
                      </OutboundLink>
                    ) : null}
                    {linkToProfile && (
                      <Link
                        href={linkToProfile}
                        className="border-border bg-card text-foreground hover:bg-secondary inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
                      >
                        <Store className="size-3.5" />
                        View shop
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContentHighContrast>
    </Dialog>
  );
}
