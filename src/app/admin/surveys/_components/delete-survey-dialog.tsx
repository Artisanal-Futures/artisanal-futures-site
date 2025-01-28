import { TrashIcon } from "lucide-react";

import { api } from "~/trpc/react";
import { useDefaultMutationActions } from "~/hooks/use-default-mutation-actions";

import { SingleActionDialog } from "../../_components/single-action-dialog";

type Props = { surveyId: string };

export function DeleteSurveyDialog({ surveyId }: Props) {
  const { defaultActions } = useDefaultMutationActions({
    entity: "survey",
  });

  const deleteShop = api.survey.delete.useMutation(defaultActions);

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
