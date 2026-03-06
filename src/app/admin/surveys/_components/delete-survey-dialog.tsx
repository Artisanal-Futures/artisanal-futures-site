import { useRouter } from "next/navigation";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { SingleActionDialog } from "../../_components/single-action-dialog";

type Props = { surveyId: string };

export function DeleteSurveyDialog({ surveyId }: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();
  const deleteShop = api.survey.delete.useMutation({
    onSuccess: ({ message }) => {
      toast.success(message);
      void apiUtils.survey.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete survey.");
    },
  });

  const onSubmit = () => deleteShop.mutate({ surveyId });

  return (
    <SingleActionDialog
      onSubmit={onSubmit}
      color="red"
      actionText="Delete"
      description={`Deleting a survey will remove it from the database permanently.
        Are you sure you want to delete this survey?`}
      title="Delete survey?"
      icon={TrashIcon}
      isLoading={deleteShop.isPending}
    />
  );
}
