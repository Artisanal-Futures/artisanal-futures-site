"use client";

import { useState } from "react";
import Image from "next/image";

import type { MapShop } from "../_lib/types";
import { getInitials } from "~/lib/get-initials";
import { handleImageUrl } from "~/lib/handle-image-url";
import { cn } from "~/lib/utils";

type ShopAvatarProps = {
  shop: Pick<MapShop, "name" | "ownerName" | "logoPhoto" | "ownerPhoto">;
  /** Pixel size of the (square) avatar. */
  size: number;
  className?: string;
};

/** Logo, else owner photo, else initials on a muted circle. */
export function ShopAvatar({ shop, size, className }: ShopAvatarProps) {
  const source = shop.logoPhoto ?? shop.ownerPhoto;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const showImage = !!source && failedSource !== source;
  const initials = getInitials(shop.name || shop.ownerName) || "?";
  const alt = shop.logoPhoto ? `${shop.name} logo` : `${shop.ownerName} photo`;

  return (
    <div
      className={cn(
        "text-muted-foreground relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border font-semibold select-none",
        showImage ? "bg-white" : "bg-muted",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {showImage ? (
        <Image
          src={handleImageUrl(source)}
          alt={alt}
          width={size}
          height={size}
          sizes={`${size}px`}
          className="size-full object-cover"
          onError={() => setFailedSource(source)}
        />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </div>
  );
}
