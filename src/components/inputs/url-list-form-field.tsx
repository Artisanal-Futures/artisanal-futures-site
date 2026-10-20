"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

type Props<CurrentForm extends FieldValues> = {
  form: UseFormReturn<CurrentForm>;
  /** A `string[]` field. Blank rows are fine; the validator drops them. */
  name: Path<CurrentForm>;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  addLabel?: string;
  /** Plain text instead of URLs (e.g. alternate names). */
  type?: "url" | "text";
};

/** An editable list of single-line values (profile URLs, names) with add/remove. */
export const UrlListFormField = <CurrentForm extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  disabled,
  placeholder = "https://instagram.com/yourshop",
  addLabel = "Add link",
  type = "url",
}: Props<CurrentForm>) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const values = (field.value as string[] | undefined) ?? [];
        const setValues = (next: string[]) =>
          field.onChange(next as typeof field.value);

        return (
          <FormItem className={cn("col-span-full", className)}>
            {label && <FormLabel>{label}</FormLabel>}
            <div className="space-y-2">
              {values.map((value, index) => {
                const error = form.getFieldState(
                  `${name}.${index}` as Path<CurrentForm>,
                  form.formState,
                ).error;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type={type}
                        inputMode={type === "url" ? "url" : undefined}
                        value={value}
                        disabled={disabled}
                        placeholder={placeholder}
                        aria-label={`${label ?? "Item"} ${index + 1}`}
                        aria-invalid={!!error}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          setValues(
                            values.map((current, i) =>
                              i === index ? e.target.value : current,
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        aria-label={`Remove ${label ?? "item"} ${index + 1}`}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() =>
                          setValues(values.filter((_, i) => i !== index))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {error?.message && (
                      <p className="text-destructive text-sm">
                        {error.message}
                      </p>
                    )}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setValues([...values, ""])}
              >
                <Plus className="mr-2 h-4 w-4" />
                {addLabel}
              </Button>
            </div>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
