"use client";

import Image from "next/image";

import type { RouterOutputs } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";

type Product = NonNullable<RouterOutputs["shop"]["get"]>["products"][number];
type Service = NonNullable<RouterOutputs["shop"]["get"]>["services"][number];

export function ProductCard({
  item,
  onClick,
}: {
  item: Product | Service;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group border-border bg-card hover:border-ring/30 flex flex-col overflow-hidden rounded-xl border text-left shadow-sm transition-all hover:shadow-md"
    >
      {/* Image */}
      {item.imageUrl ? (
        <div className="bg-muted relative aspect-4/3 w-full overflow-hidden">
          <Image
            src={item.imageUrl ?? "/placeholder.svg"}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="bg-muted flex aspect-4/3 w-full items-center justify-center">
          <span className="text-muted-foreground/30 text-3xl font-semibold">
            {item.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-card-foreground group-hover:text-foreground text-sm leading-snug font-semibold">
          {item.name}
        </h3>
        {item.description && (
          <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
            {item.description}
          </p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="rounded-full px-2 py-0 text-[10px] font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
