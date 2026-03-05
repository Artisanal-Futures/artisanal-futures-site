"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type Product = NonNullable<RouterOutputs["shop"]["get"]>["products"][number];
type Service = NonNullable<RouterOutputs["shop"]["get"]>["services"][number];

type Props = {
  item: Product | Service;
  open: boolean;
  website: string;
  onOpenChange: (open: boolean) => void;
};
export function ProductDetailDialog({ item, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-xl">
        {/* Image */}
        {item?.imageUrl ? (
          <div className="bg-muted relative aspect-4/3 w-full">
            <Image
              src={item.imageUrl ?? "/placeholder.svg"}
              alt={item?.name ?? ""}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="bg-muted flex aspect-4/3 w-full items-center justify-center">
            <span className="text-muted-foreground/40 text-4xl font-semibold">
              {item?.name?.charAt(0)}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-4 p-6">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl">{item?.name ?? ""}</DialogTitle>
            {item?.description && (
              <DialogDescription className="text-foreground/70 text-sm leading-relaxed">
                {item?.description ?? ""}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Tags */}
          {item?.tags && item?.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="rounded-full px-2.5 py-0.5 text-xs font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* External Link */}
          {((item as Product)?.productUrl ?? (item as Service)?.serviceUrl) && (
            <a
              href={
                (item as Product)?.productUrl ??
                (item as Service)?.serviceUrl ??
                ""
              }
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 self-start rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Purchase from their website
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
