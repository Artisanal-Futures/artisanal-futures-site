"use client";

import { useRouter } from "next/navigation";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { SingleActionDialog } from "../../_components/single-action-dialog";

type Props = { productId: string };

export function DeleteProductDialog(props: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();

  const deleteProduct = api.product.delete.useMutation({
    onMutate: () => ({
      toastId: toast.loading("Deleting product, please wait..."),
    }),
    onSuccess: ({ message }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      void apiUtils.product.invalidate();
      router.refresh();
    },
    onError: (error, _input, context) => {
      toast.error(error.message, { id: context?.toastId });
    },
  });

  const onSubmit = () => deleteProduct.mutate({ id: props.productId });

  return (
    <SingleActionDialog
      onSubmit={onSubmit}
      color="red"
      actionText="Delete"
      description={`This action cannot be undone. This will permanently delete this
            product and remove the
            data from our servers.`}
      title="Delete product?"
      icon={TrashIcon}
      isLoading={deleteProduct.isPending}
    />
  );
}
