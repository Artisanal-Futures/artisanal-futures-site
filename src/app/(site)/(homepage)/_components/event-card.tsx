"use client";

import { format } from "date-fns";

import { handleImageUrl } from "~/lib/handle-image-url";
import { ImageWithFallback } from "~/components/image-with-fallback";
import type { HomepageEvent } from "./events-board";

type Props = {
  event: HomepageEvent;
  onOpen: (event: HomepageEvent) => void;
};

export function EventCard({ event, onOpen }: Props) {
  const rawImage = event.imageUrl;
  const imageSrc = rawImage
    ? /^(https?:|\/)/.test(rawImage)
      ? rawImage
      : handleImageUrl(rawImage)
    : null;

  const rawLogo = event.shop.logoPhoto;
  const fallbackSrc = rawLogo
    ? /^(https?:|\/)/.test(rawLogo)
      ? rawLogo
      : handleImageUrl(rawLogo)
    : undefined;

  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      className="group rounded-2xl border bg-card shadow-sm text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-muted">
        {imageSrc ? (
          <ImageWithFallback
            src={imageSrc}
            fallbackSrc={fallbackSrc}
            alt={`Event image for ${event.title}`}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl font-semibold text-muted-foreground/30">
              {event.title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          {event.shop.name}
        </span>
        <h4 className="line-clamp-2 text-sm font-semibold text-foreground">
          {event.title}
        </h4>
        <p className="text-xs text-muted-foreground">
          {format(new Date(event.startDate), "MMM d, yyyy")}
        </p>
      </div>
    </button>
  );
}
