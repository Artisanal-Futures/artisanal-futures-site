"use client";

import { ExternalLink } from "lucide-react";
import { format } from "date-fns";

import { handleImageUrl } from "~/lib/handle-image-url";
import { ImageWithFallback } from "~/components/image-with-fallback";
import {
  Dialog,
  DialogContentHighContrast,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { HomepageEvent } from "./events-board";

type Props = {
  event: HomepageEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EventDetailDialog({ event, open, onOpenChange }: Props) {
  if (!event) return null;

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

  const dateLabel = event.endDate
    ? `${format(new Date(event.startDate), "MMM d, yyyy 'at' h:mm a")} → ${format(new Date(event.endDate), "MMM d, yyyy 'at' h:mm a")}`
    : format(new Date(event.startDate), "MMM d, yyyy 'at' h:mm a");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentHighContrast className="max-h-[90vh] max-w-md gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-3xl sm:overflow-hidden">
        <div className="grid sm:max-h-[min(85vh,34rem)] sm:grid-cols-2">
          {/* Image */}
          <div className="bg-muted sm:flex sm:h-full sm:items-center sm:justify-center">
            {imageSrc ? (
              <div className="relative aspect-square w-full">
                <ImageWithFallback
                  src={imageSrc}
                  fallbackSrc={fallbackSrc}
                  alt={`Event image for ${event.title}`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center">
                <span className="text-5xl font-semibold text-muted-foreground/40">
                  {event.title.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3 p-5 sm:h-full sm:overflow-hidden">
            <DialogHeader className="gap-1">
              <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                {event.shop.name}
              </span>
              <DialogTitle className="text-xl">{event.title}</DialogTitle>
            </DialogHeader>

            {/* Description (scrollable on desktop) */}
            {event.description && (
              <div className="sm:min-h-0 sm:flex-1 sm:overflow-y-auto">
                <DialogDescription className="text-sm leading-relaxed text-foreground/70 whitespace-pre-line">
                  {event.description}
                </DialogDescription>
              </div>
            )}

            {/* Date / time */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                Date &amp; Time
              </span>
              <p className="text-sm text-foreground/80">{dateLabel}</p>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                  Location
                </span>
                <p className="text-sm text-foreground/80">{event.location}</p>
              </div>
            )}

            {/* CTA */}
            {event.callToActionLink && (
              <div className="pt-1">
                <a
                  href={event.callToActionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  Learn More
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </DialogContentHighContrast>
    </Dialog>
  );
}
