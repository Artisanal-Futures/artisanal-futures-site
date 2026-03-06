import { useRouter } from "next/navigation";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { SingleActionDialog } from "../../_components/single-action-dialog";

type Props = { shopId: string };

export function DeleteShopDialog({ shopId }: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();
  const deleteShop = api.shop.delete.useMutation({
    onSuccess: ({ message }) => {
      toast.success(message);
      void apiUtils.shop.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete shop.");
    },
  });

  const onSubmit = () => deleteShop.mutate({ shopId });

  return (
    <SingleActionDialog
      onSubmit={onSubmit}
      color="red"
      actionText="Delete"
      description={`Deleting a shop will remove it from the database permanently.
        Are you sure you want to delete this shop?`}
      title="Delete shop?"
      icon={TrashIcon}
      isLoading={deleteShop.isPending}
    />
  );
}
