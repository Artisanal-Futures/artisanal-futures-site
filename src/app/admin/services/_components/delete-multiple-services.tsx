"use client";

import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";

export function DeleteMultipleServicesDialog({
  serviceIds,
  onSuccessCallback,
}: {
  serviceIds: string[];
  onSuccessCallback?: () => void;
}) {
  const apiUtils = api.useUtils();
  const router = useRouter();
  const deleteServices = api.service.deleteMultiple.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Services deleted successfully.");
      void apiUtils.service.invalidate();
      onSuccessCallback?.();
      router.push("/admin/services");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete services.");
    },
    onMutate: () => {
      toast.loading("Deleting services, please wait...");
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="h-8 text-xs lg:px-3">
          <Trash2Icon className="mr-2 h-4 w-4" />
          Delete ({serviceIds.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>
            Delete {serviceIds.length} services?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete these services and remove the data from
            our servers. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => deleteServices.mutate(serviceIds)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
