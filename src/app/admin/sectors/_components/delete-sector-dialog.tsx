"use client";

import { useRouter } from "next/navigation";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { SingleActionDialog } from "../../_components/single-action-dialog";

type Props = {
  sectorId: string;
  sectorName: string;
  shopCount: number;
  /** Runs after a successful delete. Defaults to refreshing the page. */
  onDeleted?: () => void;
};

export function DeleteSectorDialog({
  sectorId,
  sectorName,
  shopCount,
  onDeleted,
}: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();

  const deleteSector = api.shopSector.delete.useMutation({
    onMutate: () => ({
      toastId: toast.loading("Deleting sector, please wait..."),
    }),
    onSuccess: ({ message }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      void apiUtils.shopSector.invalidate();
      if (onDeleted) onDeleted();
      else router.refresh();
    },
    onError: (error, _input, context) => {
      toast.error(error.message, { id: context?.toastId });
    },
  });

  const shopImpact =
    shopCount === 0
      ? "No shops are using it."
      : shopCount === 1
        ? '1 shop will fall back to "Other".'
        : `${shopCount} shops will fall back to "Other".`;

  return (
    <SingleActionDialog
      onSubmit={() => deleteSector.mutate({ id: sectorId })}
      color="red"
      actionText="Delete"
      description={`${shopImpact} Links to the map filtered by this sector will stop filtering by it. This action cannot be undone.`}
      title={`Delete "${sectorName}"?`}
      icon={TrashIcon}
      isLoading={deleteSector.isPending}
    />
  );
}
