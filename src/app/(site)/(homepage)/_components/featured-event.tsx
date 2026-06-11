"use client";

import { ChevronRight } from "lucide-react";

import type { HomepageEvent } from "./events-board";
import { handleImageUrl } from "~/lib/handle-image-url";
import { ImageWithFallback } from "~/components/image-with-fallback";

type Props = {
  event: HomepageEvent;
  onOpen: (event: HomepageEvent) => void;
};

export function FeaturedEvent({ event, onOpen }: Props) {
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
      className="group focus-visible:ring-ring bg-card block w-full rounded-2xl border text-left shadow-sm transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex flex-col items-center gap-6 p-6 lg:flex-row">
        {imageSrc && (
          <div className="lg:w-1/2">
            <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-xl">
              <ImageWithFallback
                src={imageSrc}
                fallbackSrc={fallbackSrc}
                alt={`Event image for ${event.title}`}
                fill
                className="object-contain transition-transform group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4 lg:w-1/2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {event.shop.name}
          </span>
          <h3 className="text-foreground text-2xl font-bold">{event.title}</h3>
          {event.description && (
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          )}
          <span className="text-primary mt-auto inline-flex items-center gap-1 text-sm font-medium group-hover:underline">
            Click for more details
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
