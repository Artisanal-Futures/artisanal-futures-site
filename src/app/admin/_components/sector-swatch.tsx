import type { CSSProperties } from "react";

import type { SectorColor } from "~/lib/constants/shop-sectors";
import { cn } from "~/lib/utils";

/** A sector's color as a dot, per theme. Decorative: always pair a label. */
export function SectorSwatch({
  color,
  className,
}: {
  color: SectorColor;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2.5 shrink-0 rounded-full bg-(--dot-light) dark:bg-(--dot-dark)",
        className,
      )}
      style={
        {
          "--dot-light": color.light,
          "--dot-dark": color.dark,
        } as CSSProperties
      }
    />
  );
}
