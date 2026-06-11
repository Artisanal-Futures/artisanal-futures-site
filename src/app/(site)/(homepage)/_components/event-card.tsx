"use client";

import { ExternalLink } from "lucide-react";
import { format } from "date-fns";

import type { HomepageEvent } from "./events-board";
import { handleImageUrl } from "~/lib/handle-image-url";
import { ImageWithFallback } from "~/components/image-with-fallback";

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
    <div className="group focus-within:ring-ring bg-card relative flex flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-shadow hover:shadow-md focus-within:ring-2">
      {/* Full-card click target (opens the details dialog). Sits beneath the CTA. */}
      <button
        type="button"
        onClick={() => onOpen(event)}
        aria-label={`View details for ${event.title}`}
        className="absolute inset-0 z-10 focus:outline-none"
      />
      <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
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
            <span className="text-muted-foreground/30 text-4xl font-semibold">
              {event.title.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {event.shop.name}
        </span>
        <h4 className="text-foreground line-clamp-2 text-sm font-semibold">
          {event.title}
        </h4>
        <p className="text-muted-foreground text-xs">
          {format(new Date(event.startDate), "MMM d, yyyy")}
        </p>
        {event.callToActionLink && (
          <a
            href={event.callToActionLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-primary relative z-20 mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium hover:underline"
          >
            Learn more
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
}
