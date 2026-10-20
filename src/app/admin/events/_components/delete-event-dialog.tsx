"use client";

import { useRouter } from "next/navigation";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { SingleActionDialog } from "../../_components/single-action-dialog";

type Props = { eventId: string };

export function DeleteEventDialog(props: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();

  const deleteEvent = api.event.delete.useMutation({
    onMutate: () => ({
      toastId: toast.loading("Deleting event, please wait..."),
    }),
    onSuccess: ({ message }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      void apiUtils.event.invalidate();
      router.refresh();
    },
    onError: (error, _input, context) => {
      toast.error(error.message, { id: context?.toastId });
    },
  });

  const onSubmit = () => deleteEvent.mutate({ id: props.eventId });

  return (
    <SingleActionDialog
      onSubmit={onSubmit}
      color="red"
      actionText="Delete"
      description={`This action cannot be undone. This will permanently delete this
            event and remove the
            data from our servers.`}
      title="Delete event?"
      icon={TrashIcon}
      isLoading={deleteEvent.isPending}
    />
  );
}
