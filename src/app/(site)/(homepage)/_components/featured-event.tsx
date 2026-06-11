"use client";

import { ChevronRight, ExternalLink } from "lucide-react";

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
    <div className="group focus-within:ring-ring bg-card relative rounded-2xl border shadow-sm transition-shadow focus-within:ring-2 hover:shadow-md">
      {/* Full-card click target (opens the details dialog). Sits beneath the CTA. */}
      <button
        type="button"
        onClick={() => onOpen(event)}
        aria-label={`View details for ${event.title}`}
        className="absolute inset-0 z-10 rounded-2xl focus:outline-none"
      />
      <div className="flex flex-col items-center gap-6 p-6 lg:flex-row">
        {imageSrc && (
          <div className="w-full lg:w-1/2">
            <div className="bg-muted relative aspect-4/3 w-full overflow-hidden rounded-xl">
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
        <div className="flex w-full flex-col gap-4 lg:w-1/2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {event.shop.name}
          </span>
          <h3 className="text-foreground text-2xl font-bold">{event.title}</h3>
          {event.description && (
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-3">
            {event.callToActionLink && (
              <a
                href={event.callToActionLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 relative z-20 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Learn More
                <ExternalLink className="size-3.5" />
              </a>
            )}
            <span className="text-muted-foreground group-hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors">
              Click for more details
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
