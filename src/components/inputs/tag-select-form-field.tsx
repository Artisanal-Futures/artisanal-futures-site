"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { X } from "lucide-react";

import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

type Props<CurrentForm extends FieldValues> = {
  form: UseFormReturn<CurrentForm>;
  name: Path<CurrentForm> & string;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  bodyClassName?: string;
  /** Options to pick from (e.g. suggested tags). Value is stored as string[] of selected item ids. */
  items: {
    id: string;
    label: string;
  }[];
  /** If true, show an input to add custom tags not in the list */
  allowCustom?: boolean;
  customTagPlaceholder?: string;
};

export const TagSelectFormField = <CurrentForm extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  disabled,
  bodyClassName,
  items,
  allowCustom = false,
  customTagPlaceholder = "Add custom tag...",
}: Props<CurrentForm>) => {
  const [customTag, setCustomTag] = useState("");

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const value = (field.value ?? []) as string[];
        const toggle = (id: string) => {
          if (disabled) return;
          const next = value.includes(id)
            ? value.filter((v) => v !== id)
            : [...value, id];
          field.onChange(next);
        };
        const addCustom = () => {
          const trimmed = customTag.trim();
          if (trimmed && !value.includes(trimmed)) {
            field.onChange([...value, trimmed]);
            setCustomTag("");
          }
        };

        return (
          <FormItem className={cn("col-span-full", className)}>
            <div className="mb-3">
              {label && <FormLabel>{label}</FormLabel>}
              {description && <FormDescription>{description}</FormDescription>}
            </div>
            <FormControl>
              <div className={cn("space-y-3", bodyClassName)}>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(item.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        value.includes(item.id)
                          ? "border-secondary-foreground bg-secondary text-secondary-foreground"
                          : "border-border text-muted-foreground hover:border-secondary-foreground/50 hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                {allowCustom && (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder={customTagPlaceholder}
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustom();
                        }
                      }}
                      className="flex-1"
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCustom}
                      disabled={disabled}
                    >
                      Add
                    </Button>
                  </div>
                )}
                {value.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-muted-foreground text-xs">
                      Selected:
                    </span>
                    {value.map((id) => {
                      const labelForId =
                        items.find((i) => i.id === id)?.label ?? id;
                      return (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="gap-1 rounded-full pr-1"
                        >
                          {labelForId}
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => toggle(id)}
                            className="hover:bg-secondary-foreground/10 ml-0.5 rounded-full p-0.5"
                            aria-label={`Remove ${labelForId}`}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
