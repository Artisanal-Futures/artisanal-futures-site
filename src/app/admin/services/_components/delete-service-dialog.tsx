"use client";

import { useRouter } from "next/navigation";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { SingleActionDialog } from "../../_components/single-action-dialog";

type Props = { serviceId: string };

export function DeleteServiceDialog(props: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();

  const deleteService = api.service.delete.useMutation({
    onSuccess: () => {
      toast.success("Service deleted successfully.");
      void apiUtils.service.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete service.");
    },
  });

  const onSubmit = () => deleteService.mutate(props.serviceId);

  return (
    <SingleActionDialog
      onSubmit={onSubmit}
      color="red"
      actionText="Delete"
      description={`This action cannot be undone. This will permanently delete this
            service and remove the
            data from our servers.`}
      title="Delete service?"
      icon={TrashIcon}
      isLoading={deleteService.isPending}
    />
  );
}
