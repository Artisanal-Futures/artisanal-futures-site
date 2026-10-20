import { useRouter } from "next/navigation";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { SingleActionDialog } from "../../_components/single-action-dialog";

type Props = { surveyId: string };

export function DeleteSurveyDialog({ surveyId }: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();
  const deleteSurvey = api.survey.delete.useMutation({
    onMutate: () => ({
      toastId: toast.loading("Deleting survey, please wait..."),
    }),
    onSuccess: ({ message }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      void apiUtils.survey.invalidate();
      router.refresh();
    },
    onError: (error, _input, context) => {
      toast.error(error.message, { id: context?.toastId });
    },
  });

  const onSubmit = () => deleteSurvey.mutate({ id: surveyId });

  return (
    <SingleActionDialog
      onSubmit={onSubmit}
      color="red"
      actionText="Delete"
      description={`Deleting a survey will remove it from the database permanently.
        Are you sure you want to delete this survey?`}
      title="Delete survey?"
      icon={TrashIcon}
      isLoading={deleteSurvey.isPending}
    />
  );
}
