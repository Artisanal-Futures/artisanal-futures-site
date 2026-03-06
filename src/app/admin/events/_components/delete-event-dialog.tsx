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
    onSuccess: () => {
      toast.dismiss();
      toast.success("Event deleted successfully.");
      void apiUtils.event.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete event.");
    },
    onMutate: () => {
      toast.loading("Deleting event, please wait...");
    },
  });

  const onSubmit = () => deleteEvent.mutate(props.eventId);

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
