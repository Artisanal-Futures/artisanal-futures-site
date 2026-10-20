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
    onMutate: () => ({
      toastId: toast.loading("Deleting shop, please wait..."),
    }),
    onSuccess: ({ message }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      void apiUtils.shop.invalidate();
      router.refresh();
    },
    onError: (error, _input, context) => {
      toast.error(error.message, { id: context?.toastId });
    },
  });

  const onSubmit = () => deleteShop.mutate({ id: shopId });

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
