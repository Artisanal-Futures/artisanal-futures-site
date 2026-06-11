"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  /** Shown when `src` fails to load (e.g. a store image behind a broken cert). */
  fallbackSrc?: string | null;
};

/**
 * `next/image` wrapper that swaps to `fallbackSrc` when the primary image
 * fails to load. Used for product/shop images pulled from external stores,
 * which can 404 or fail at the optimizer (e.g. expired TLS certificate); in
 * those cases we fall back to the business's logo instead of a broken image.
 */
export function ImageWithFallback({ src, fallbackSrc, alt, ...rest }: Props) {
  const [useFallback, setUseFallback] = useState(false);

  // Reset when the primary src changes so a reused instance (e.g. in a list)
  // doesn't keep showing the previous item's fallback.
  useEffect(() => {
    setUseFallback(false);
  }, [src]);

  const resolvedSrc = useFallback && fallbackSrc ? fallbackSrc : src;

  return (
    <Image
      {...rest}
      src={resolvedSrc}
      alt={alt}
      onError={() => {
        if (!useFallback && fallbackSrc && fallbackSrc !== src) {
          setUseFallback(true);
        }
      }}
    />
  );
}
