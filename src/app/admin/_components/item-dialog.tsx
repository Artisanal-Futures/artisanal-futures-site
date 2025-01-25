import { useEffect, useState } from "react";
import { CirclePlusIcon, PencilIcon } from "lucide-react";
import { useSession } from "next-auth/react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

type FormComponentProps<T> = {
  initialData: T | null;
  defaultEmail?: string;
  onSuccessCallback: () => void;
};

type Props<T> = {
  id?: number | string;
  param?: string;
  type?: string;
  title: string;
  subtitle: string;
  initialData?: T | null;
  defaultEmail?: string;
  buttonClassName?: string;
  contentClassName?: string;
  buttonText?: string | React.ReactNode;
  mode?: "create" | "update";
  FormComponent: React.FC<FormComponentProps<T>>;
};

export const handleUrlParam = (
  id: number | string | undefined,
  isOpen: boolean,
  param: string,
) => {
  if (!id) return;

  const url = new URL(window.location.href);
  if (isOpen) {
    url.searchParams.set(param, `${id}`);
  } else {
    url.searchParams.delete(param);
  }
  window.history.pushState({}, "", url.toString());
};

export function ItemDialog<T>({
  id,
  type,
  title,
  subtitle,
  initialData = null,
  defaultEmail,
  param,
  FormComponent,
  buttonClassName,
  contentClassName,
  buttonText,
  mode = "update",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!id) return;

    const url = new URL(window.location.href);
    const editParam = url.searchParams.get(param ?? "edit");
    if (editParam === `${id}`) {
      setOpen(true);
    }
  }, [id, param]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (id) {
      handleUrlParam(id, isOpen, param ?? "edit");
    }
  };

  const handleSuccess = () => {
    if (id) {
      handleUrlParam(id, false, param ?? "edit");
    }
    setOpen(false);
  };

  const defaultButtonContent =
    mode === "create" ? (
      <>
        <CirclePlusIcon className="mr-1 h-4 w-4" /> Create {type}
      </>
    ) : (
      <>
        <PencilIcon className="mr-1 h-4 w-4" /> Edit
      </>
    );

  const defaultButtonClassName =
    mode === "create"
      ? "h-8 text-xs"
      : "bg-blue-500 text-xs hover:bg-blue-600 h-8";

  // Only show dialog if user has appropriate permissions

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className={cn(defaultButtonClassName, buttonClassName)}
          size={"sm"}
        >
          {buttonText ?? defaultButtonContent}
        </Button>
      </DialogTrigger>
      <DialogContent className={cn("h-auto sm:max-w-6xl", contentClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        {FormComponent && (
          <FormComponent
            initialData={initialData}
            defaultEmail={defaultEmail}
            onSuccessCallback={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
