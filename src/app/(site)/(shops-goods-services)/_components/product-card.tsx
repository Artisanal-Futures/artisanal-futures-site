"use client";

import type { RouterOutputs } from "~/trpc/react";
import { formatPrice } from "~/lib/format-price";
import { handleImageUrl } from "~/lib/handle-image-url";
import { Badge } from "~/components/ui/badge";
import { ImageWithFallback } from "~/components/image-with-fallback";

type Product = NonNullable<RouterOutputs["shop"]["get"]>["products"][number];
type Service = NonNullable<RouterOutputs["shop"]["get"]>["services"][number];

type Props = {
  item: Product | Service;
  onClick: () => void;
  createdBy?: string;
  shopPrinciples?: string[];
  /** Business logo, shown if the product image fails to load. */
  fallbackImage?: string | null;
  /** Whether to show the price line. Hidden on the collections/listing pages. */
  showPrice?: boolean;
};
export function ProductCard({
  item,
  onClick,
  createdBy,
  shopPrinciples,
  fallbackImage,
  showPrice = true,
}: Props) {
  const fallbackSrc =
    fallbackImage?.trim() && fallbackImage !== "null"
      ? fallbackImage.startsWith("http")
        ? fallbackImage
        : handleImageUrl(fallbackImage)
      : undefined;
  const price = formatPrice(item.priceInCents, item.currency);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group border-border bg-card hover:border-ring/30 flex cursor-pointer flex-col overflow-hidden rounded-xl border text-left shadow-sm transition-all hover:shadow-md"
    >
      {/* Image */}
      {item.imageUrl ? (
        <div className="bg-muted relative aspect-square w-full overflow-hidden">
          <ImageWithFallback
            src={item.imageUrl ?? "/placeholder.svg"}
            fallbackSrc={fallbackSrc}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="bg-muted flex aspect-square w-full items-center justify-center">
          <span className="text-muted-foreground/30 text-3xl font-semibold">
            {item.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Content */}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-card-foreground group-hover:text-foreground text-sm leading-snug font-semibold">
          {item.name}
        </h3>
        {createdBy && (
          <p className="text-muted-foreground text-xs">
            by{" "}
            <span className="text-foreground/80 font-medium">{createdBy}</span>
          </p>
        )}
        {showPrice &&
          (price !== null ? (
            <p className="text-foreground/70 text-xs font-medium">{price}</p>
          ) : (
            <p className="text-muted-foreground text-xs">
              See shop for pricing
            </p>
          ))}
        {shopPrinciples && shopPrinciples.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {shopPrinciples.slice(0, 2).map((principle) => (
              <Badge
                key={principle}
                variant="outline"
                className="border-primary/30 text-primary/80 rounded-full px-2 py-0 text-[10px] font-normal"
              >
                {principle}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
