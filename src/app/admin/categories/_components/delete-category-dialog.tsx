"use client";

import { useRouter } from "next/navigation";
import { TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { SingleActionDialog } from "../../_components/single-action-dialog";

type Props = { categoryId: string };

export function DeleteCategoryDialog(props: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();

  const deleteCategory = api.category.delete.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Category deleted successfully.");
      void apiUtils.category.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete category.");
    },
    onMutate: () => {
      toast.loading("Deleting category, please wait...");
    },
  });

  const onSubmit = () => deleteCategory.mutate({ id: props.categoryId });

  return (
    <SingleActionDialog
      onSubmit={onSubmit}
      color="red"
      actionText="Delete"
      description={`This action cannot be undone. This will permanently delete this
            category and remove the
            data from our servers.`}
      title="Delete category?"
      icon={TrashIcon}
      isLoading={deleteCategory.isPending}
    />
  );
}
