import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import Image from "next/image";
import { TrashIcon } from "lucide-react";

import { env } from "~/env";
import { useFileUpload } from "~/lib/file-upload/hooks/use-file-upload";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";

type Props<CurrentForm extends FieldValues> = {
  form: UseFormReturn<CurrentForm>;
  name: Path<CurrentForm>;
  onUpdate?: (url: string) => void;
  onDelete?: (url: string) => void;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  folder: string;
};

export const AvatarImageFormField = <CurrentForm extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  disabled,
  onDelete,
  onUpdate,
  folder,
}: Props<CurrentForm>) => {
  const { uploadFile, isUploading } = useFileUpload({
    route: folder,
    api: "/api/upload-shop",
    generateThumbnail: false,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = await uploadFile(file);
      const formattedUrl = `${uploadedUrl}`;
      if (uploadedUrl) {
        if (onUpdate) {
          onUpdate(formattedUrl);
        }
        form.setValue(
          name,
          formattedUrl as PathValue<CurrentForm, Path<CurrentForm>>,
        );
      }
    } catch (error) {
      console.error("Failed to upload file:", error);
    }
  };

  const handleRemove = () => {
    const currentValue = form.getValues(name);
    if (onDelete && currentValue) {
      onDelete(currentValue);
    }
    form.setValue(name, "" as PathValue<CurrentForm, Path<CurrentForm>>);
  };

  const isImageUrl = (url: string) => {
    return url.startsWith("http");
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("col-span-full", className)}>
          {label && <FormLabel>{label}</FormLabel>}
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <div className="flex items-center gap-4">
              {field.value && (
                <div className="group relative h-20 w-20">
                  <Image
                    src={
                      isImageUrl(field.value)
                        ? field.value
                        : `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${field.value}`
                    }
                    alt="Avatar"
                    className="h-full w-full rounded-full object-cover"
                    width={80}
                    height={80}
                  />

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-0 top-0 opacity-0 group-hover:opacity-100"
                    onClick={handleRemove}
                    disabled={disabled ?? isUploading}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label htmlFor={`avatar-upload-${name}`}>
                  {isUploading ? "Uploading..." : "Change Photo"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={disabled ?? isUploading}
                  className="hidden"
                  id={`avatar-upload-${name}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled ?? isUploading}
                  onClick={() => {
                    document.getElementById(`avatar-upload-${name}`)?.click();
                  }}
                >
                  {isUploading ? "Uploading..." : "Change Photo"}
                </Button>
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
