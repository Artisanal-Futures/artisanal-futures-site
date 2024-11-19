import { isEqual } from "lodash";
import { useEffect, useState } from "react";
import { type UseFormReturn } from "react-hook-form";

export const useUnsavedChanges = <T extends Record<string, unknown>>({
  form,
  defaultValues,
}: {
  form: UseFormReturn<T>;
  defaultValues: T;
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  useEffect(() => {
    const subscription = form.watch((value) => {
      setHasUnsavedChanges(!isEqual(value, defaultValues));
    });
    return () => subscription.unsubscribe();
  }, [form, defaultValues]);

  return {
    hasUnsavedChanges,
  };
};
