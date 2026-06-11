"use client";

import { ImageWithFallback } from "~/components/image-with-fallback";

type Props = {
  id: string;
  name: string;
  image?: string;
  hasLink?: boolean;
  subheader?: string;
  /** Shown if `image` fails to load (e.g. a store image behind a broken cert). */
  fallbackImage?: string | null;
};

export const RowImageLink = ({
  name,
  image,
  subheader,
  fallbackImage,
}: Props) => {
  return (
    <div className="group flex w-full items-center gap-2">
      <div className="relative aspect-square h-10 rounded-lg border border-border shadow-sm">
        <ImageWithFallback
          src={image ?? "/placeholder-image.webp"}
          fallbackSrc={fallbackImage}
          fill
          className="rounded-lg"
          alt=""
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm text-gray-500">{name}</span>
        {subheader && (
          <span className="truncate text-xs text-muted-foreground">{subheader}</span>
        )}
      </div>
    </div>
  );
};
