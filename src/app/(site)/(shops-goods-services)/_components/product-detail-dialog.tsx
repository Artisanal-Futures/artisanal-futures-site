"use client";

import Link from "next/link";
import { ExternalLink, User } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { handleImageUrl } from "~/lib/handle-image-url";
import { Badge } from "~/components/ui/badge";
import { ImageWithFallback } from "~/components/image-with-fallback";
import {
  Dialog,
  DialogContentHighContrast,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentHighContrast className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* Image */}
        {item?.imageUrl ? (
          <div className="bg-muted relative aspect-4/3 w-full">
            <ImageWithFallback
              src={item.imageUrl ?? "/placeholder.svg"}
              fallbackSrc={fallbackSrc}
              alt={item?.name ?? ""}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="bg-muted flex aspect-4/3 w-full items-center justify-center">
            <span className="text-muted-foreground/40 text-4xl font-semibold">
              {item?.name?.charAt(0)}
            </span>
          </div>
        )}

        {/* Content */}

        <div className="flex flex-col gap-4 p-6">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl">{item.name}</DialogTitle>
            {createdBy && (
              <DialogDescription className="text-foreground/80 text-sm leading-relaxed">
                by {createdBy}
              </DialogDescription>
            )}
            {item.description && (
              <ScrollArea className="h-48" type="always">
                <DialogDescription
                  className={cn(
                    "text-foreground/70 text-sm leading-relaxed",
                    createdBy && "pt-2",
                  )}
                >
                  {removeHtmlTags(item.description)}
                </DialogDescription>{" "}
              </ScrollArea>
            )}
          </DialogHeader>

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

          {/* Shop Principles */}
          {hasPrinciples && (
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Store Attributes
              </span>
              <div className="flex flex-wrap gap-1.5">
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
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Purchase from their website
                <ExternalLink className="size-3.5" />
              </a>
            ) : linkToWebsite ? (
              <Link
                href={linkToWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Visit their website
                <ExternalLink className="size-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="bg-primary text-primary-foreground inline-flex cursor-not-allowed items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium opacity-50"
              >
                Link is unavailable
              </button>
            )}
            {linkToProfile && (
              <Link
                href={linkToProfile}
                className="border-border bg-card text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
              >
                <User className="size-3.5" />
                View more of their products / services
              </Link>
            )}
          </div>
        </div>
      </DialogContentHighContrast>
    </Dialog>
  );
}
