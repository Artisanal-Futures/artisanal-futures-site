/* eslint-disable @typescript-eslint/no-explicit-any */
import type { UseFormReturn } from "react-hook-form";
import { useEffect, useRef } from "react";

export function useKeyboardEnter(
  form: UseFormReturn<any>,
  onSubmit: (data: any) => Promise<void>,
  onInvalid?: (errors: any) => void,
) {
  // Store the latest onSubmit in a ref to avoid stale closures
  const onSubmitRef = useRef(onSubmit);
  const onInvalidRef = useRef(onInvalid);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
    onInvalidRef.current = onInvalid;
  }, [onSubmit, onInvalid]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        void form.handleSubmit(onSubmitRef.current, onInvalidRef.current)();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [form]);
}
