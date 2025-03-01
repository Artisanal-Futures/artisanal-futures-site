import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { Checkbox } from "~/components/ui/checkbox";
import { FormField, FormItem, FormMessage } from "~/components/ui/form";
import { cn } from "~/lib/utils";

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
};

export const AcceptFormField = <CurrentForm extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
}: Props<CurrentForm>) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("col-span-full", className)}>
          <div className="items-top flex space-x-2">
            <Checkbox
              id="terms1"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <div className="grid gap-1.5 leading-none">
              {label && (
                <label
                  htmlFor="terms1"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {label}
                </label>
              )}

              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};
