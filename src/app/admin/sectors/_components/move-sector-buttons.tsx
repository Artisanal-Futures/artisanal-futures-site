"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

type Props = {
  sectorId: string;
  sectorName: string;
  isFirst: boolean;
  isLast: boolean;
};

export function MoveSectorButtons({
  sectorId,
  sectorName,
  isFirst,
  isLast,
}: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();

  const reorder = api.shopSector.reorder.useMutation({
    onSuccess: () => {
      void apiUtils.shopSector.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={isFirst || reorder.isPending}
        aria-label={`Move ${sectorName} up`}
        onClick={() => reorder.mutate({ id: sectorId, direction: "up" })}
      >
        <ArrowUp className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={isLast || reorder.isPending}
        aria-label={`Move ${sectorName} down`}
        onClick={() => reorder.mutate({ id: sectorId, direction: "down" })}
      >
        <ArrowDown className="size-4" />
      </Button>
    </div>
  );
}
