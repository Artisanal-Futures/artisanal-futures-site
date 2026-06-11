"use client";

import Link from "next/link";
import { ExternalLink, User } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { formatPrice } from "~/lib/format-price";
import { handleImageUrl } from "~/lib/handle-image-url";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContentHighContrast,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ImageWithFallback } from "~/components/image-with-fallback";

type Product = NonNullable<RouterOutputs["shop"]["get"]>["products"][number];
type Service = NonNullable<RouterOutputs["shop"]["get"]>["services"][number];

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
};

const removeHtmlTags = (text: string) => {
  return text.replace(/<[^>]*>?/g, "");
};
export function ProductDetailDialog({
  item,
  open,
  onOpenChange,
  linkToProfile,
  shopPrinciples,
  linkToWebsite,
  createdBy,
  fallbackImage,
}: Props) {
  if (!item) return null;

  const hasTags = item.tags && item.tags.length > 0;
  const hasPrinciples = shopPrinciples && shopPrinciples.length > 0;
  const fallbackSrc =
    fallbackImage?.trim() && fallbackImage !== "null"
      ? fallbackImage.startsWith("http")
        ? fallbackImage
        : handleImageUrl(fallbackImage)
      : undefined;
  const price = formatPrice(item.priceInCents, item.currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentHighContrast className="max-h-[90vh] max-w-md gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-3xl sm:overflow-hidden">
        <div className="grid sm:max-h-[min(85vh,34rem)] sm:grid-cols-2">
          {/* Image */}
          {item?.imageUrl ? (
            <div className="bg-muted sm:flex sm:h-full sm:items-center sm:justify-center">
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
              <div className="flex aspect-square w-full items-center justify-center">
                <span className="text-muted-foreground/40 text-5xl font-semibold">
                  {item?.name?.charAt(0)}
                </span>
              </div>
            </div>
          )}

          {/* Content */}

          <div className="flex flex-col gap-3 p-5 sm:h-full sm:overflow-hidden">
            <DialogHeader className="gap-1">
              {/* Store attributes (eyebrow) */}
              {hasPrinciples && (
                <div className="flex flex-wrap gap-1.5 pb-0.5">
                  {shopPrinciples?.map((principle) => (
                    <Badge
                      key={principle}
                      variant="outline"
                      className="border-primary/30 text-primary rounded-full px-2.5 py-0.5 text-xs font-normal"
                    >
                      {principle}
                    </Badge>
                  ))}
                </div>
              )}
              <DialogTitle className="text-xl">{item.name}</DialogTitle>
              {createdBy && (
                <DialogDescription className="text-foreground/80 text-sm leading-relaxed">
                  by {createdBy}
                </DialogDescription>
              )}
              {price !== null ? (
                <p className="text-foreground/80 text-sm font-medium">
                  {price}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  See shop for pricing
                </p>
              )}
            </DialogHeader>

            {/* Description (only this scrolls on desktop) */}
            {item.description && (
              <div className="sm:min-h-0 sm:flex-1 sm:overflow-y-auto">
                <DialogDescription className="text-foreground/70 text-sm leading-relaxed">
                  {removeHtmlTags(item.description)}
                </DialogDescription>
              </div>
            )}

            {/* Tags */}
            {hasTags && (
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item?.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full px-2.5 py-0.5 text-xs font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-stretch gap-2 pt-1">
              {((item as Product)?.productUrl ??
              (item as Service)?.serviceUrl) ? (
                <a
                  href={
                    (item as Product)?.productUrl ??
                    (item as Service)?.serviceUrl ??
                    ""
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  Purchase
                  <ExternalLink className="size-3.5" />
                </a>
              ) : linkToWebsite ? (
                <Link
                  href={linkToWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  Visit site
                  <ExternalLink className="size-3.5" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="bg-primary text-primary-foreground inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap opacity-50"
                >
                  Unavailable
                </button>
              )}
              {linkToProfile && (
                <Link
                  href={linkToProfile}
                  className="border-border bg-card text-foreground hover:bg-secondary inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  <User className="size-3.5" />
                  View more
                </Link>
              )}
            </div>
          </div>
        </div>
      </DialogContentHighContrast>
    </Dialog>
  );
}
