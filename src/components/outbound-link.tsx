"use client";

import type { ComponentPropsWithoutRef } from "react";

import type { OutboundClickPayload } from "~/lib/analytics/track-outbound";
import { trackOutboundClick } from "~/lib/analytics/track-outbound";

type Props = Omit<ComponentPropsWithoutRef<"a">, "target" | "rel"> & {
  /** What this click gets recorded as. Null renders a plain untracked link. */
  track: OutboundClickPayload | null;
};

/**
 * A link to an artisan's own site that counts the click. Opens in a new tab;
 * middle-click is counted too since it opens the link without firing `click`.
 */
export function OutboundLink({
  track,
  onClick,
  onAuxClick,
  children,
  ...props
}: Props) {
  return (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        if (track) trackOutboundClick(track);
        onClick?.(event);
      }}
      onAuxClick={(event) => {
        if (track && event.button === 1) trackOutboundClick(track);
        onAuxClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
