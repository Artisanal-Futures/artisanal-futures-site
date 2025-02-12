/* eslint-disable @typescript-eslint/no-empty-function */
import type { Tag } from "emblor";
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from "react-hook-form";
import React from "react";
import { TagInput } from "emblor";

import { cn } from "~/lib/utils";
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
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputId?: string;
  defaultValue?: Tag[];
};

export const TagFormField = <CurrentForm extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  placeholder,
  disabled,
  defaultValue,
}: Props<CurrentForm>) => {
  const [tags, setTags] = React.useState<Tag[]>(defaultValue ?? []);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col items-start">
          {label && <FormLabel className="text-left">{label}</FormLabel>}
          <FormControl>
            <TagInput
              {...field}
              disabled={disabled}
              placeholder={placeholder ?? ""}
              tags={tags}
              className={cn("sm:min-w-[450px]", className)}
              setTags={(newTags) => {
                setTags(newTags);
                form.setValue(
                  name,
                  newTags as PathValue<CurrentForm, Path<CurrentForm>>,
                );
              }}
              activeTagIndex={0}
              setActiveTagIndex={() => {}}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
