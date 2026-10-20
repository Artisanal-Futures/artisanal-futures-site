"use client";

import { useRouter } from "next/navigation";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { SingleActionDialog } from "../../_components/single-action-dialog";

export function DeleteItemBtn({ id }: { id: number }) {
  const apiUtils = api.useUtils();
  const router = useRouter();

  const deleteUpcycling = api.upcycling.delete.useMutation({
    onMutate: () => ({
      toastId: toast.loading("Deleting upcycling item, please wait..."),
    }),
    onSuccess: ({ message }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      void apiUtils.upcycling.invalidate();
      router.refresh();
    },
    onError: (error, _input, context) => {
      toast.error(error.message, { id: context?.toastId });
    },
  });

  return (
    <SingleActionDialog
      onSubmit={() => deleteUpcycling.mutate({ id })}
      color="red"
      actionText="Delete"
      description={`This action cannot be undone. This will permanently delete this
        upcycling item and remove the data from our servers.`}
      title="Delete upcycling item?"
      icon={TrashIcon}
      isLoading={deleteUpcycling.isPending}
    />
  );
}
