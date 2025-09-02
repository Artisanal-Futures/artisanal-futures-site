"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { BulkProductForm } from "./bulk-product-form";

type WrapperProps = {
  initialData: {
    selectedProductIds: string[];
    clearRowSelection: () => void;
  } | null; 
  onSuccessCallback: () => void;
  dialogRef?: React.RefObject<HTMLDivElement>;
};

export function BulkProductFormWrapper({
  initialData,
  onSuccessCallback,
  dialogRef,
}: WrapperProps) {
  const router = useRouter();
  const utils = api.useUtils();

  if (!initialData) {
    return null;
  }

  const { selectedProductIds, clearRowSelection } = initialData;

  return (
    <BulkProductForm
      productIds={selectedProductIds}
      dialogRef={dialogRef}
      onSuccessCallback={() => {
        void utils.product.getAll.invalidate();
        clearRowSelection();
        onSuccessCallback();
        router.refresh();
      }}
    />
  );
}