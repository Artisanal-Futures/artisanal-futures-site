"use client";

import type { MapShop } from "../_lib/types";
import type { MapMatchedItem } from "~/lib/search/map-listing-types";
import { shopPath } from "~/lib/seo/paths";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogContentHighContrast,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { ProductDetailDialog } from "~/app/(site)/(shops-goods-services)/_components/product-detail-dialog";

import { normalizeWebsite } from "./shop-map-card";

export type MapListingTarget = Pick<MapMatchedItem, "kind" | "id"> & {
  shop: MapShop;
};

type MapListingDialogProps = {
  listing: MapListingTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * A matched item's details over the map. Its state is local to the explorer:
 * it never touches the URL or the selection, so the camera stays put.
 */
export function MapListingDialog({
  listing: { kind, id, shop },
  open,
  onOpenChange,
}: MapListingDialogProps) {
  const { data, error } = api.shop.getMapListing.useQuery(
    { kind, id },
    {
      enabled: open,
      retry: (count, err) => err.data?.code !== "NOT_FOUND" && count < 1,
    },
  );

  if (data) {
    return (
      <ProductDetailDialog
        item={data}
        open={open}
        onOpenChange={onOpenChange}
        createdBy={shop.name}
        shopPrinciples={shop.attributeTags}
        linkToProfile={shopPath(shop)}
        linkToWebsite={normalizeWebsite(shop.website) ?? undefined}
        fallbackImage={shop.logoPhoto}
        shopId={shop.id}
        trackingSource="ARTISAN_MAP"
      />
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {error.data?.code === "NOT_FOUND"
                ? "This listing is no longer available"
                : "We couldn’t load this listing"}
            </DialogTitle>
            <DialogDescription>
              {error.data?.code === "NOT_FOUND"
                ? "It may have been removed by the shop."
                : "Try again in a moment."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentHighContrast className="max-h-[90vh] max-w-md gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-3xl sm:overflow-hidden">
        <DialogTitle className="sr-only">Loading listing</DialogTitle>
        <DialogDescription className="sr-only">
          The listing’s details are loading.
        </DialogDescription>
        <div className="grid sm:grid-cols-2" aria-hidden>
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-auto h-24 w-full rounded-xl" />
          </div>
        </div>
      </DialogContentHighContrast>
    </Dialog>
  );
}
