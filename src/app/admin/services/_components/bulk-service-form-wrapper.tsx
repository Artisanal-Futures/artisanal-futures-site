"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { BulkServiceForm } from "./bulk-service-form";

type Props = {
  initialData: {
    selectedServiceIds: string[];
    clearRowSelection: () => void;
  } | null;
  onSuccessCallback: () => void;
  dialogRef?: React.RefObject<HTMLDivElement>;
};

export function BulkServiceFormWrapper({
  initialData,
  onSuccessCallback,
  dialogRef,
}: Props) {
  const router = useRouter();
  const utils = api.useUtils();

  if (!initialData) {
    return null;
  }
  
  const { selectedServiceIds, clearRowSelection } = initialData;

  return (
    <BulkServiceForm
      serviceIds={selectedServiceIds}
      dialogRef={dialogRef}
      onSuccessCallback={() => {
        void utils.service.getAll.invalidate();
        clearRowSelection();
        onSuccessCallback();
        router.refresh();
      }}
    />
  );
}