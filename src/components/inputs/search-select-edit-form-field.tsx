import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import type { SearchAndSelectEditData } from "../common/search-and-select-edit";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { cn } from "~/lib/utils";
import { SearchAndSelectUserEdit } from "../common/search-and-select-edit";

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
  searchTerm?: string;
  initialData?: SearchAndSelectEditData[];
  limit?: number;
};

export const SearchSelectEditFormField = <CurrentForm extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
  disabled,

  searchTerm,
  initialData,
  limit,
}: Props<CurrentForm>) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("col-span-full", className)}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <SearchAndSelectUserEdit
              data={initialData ?? []}
              field={field}
              searchTerm={searchTerm ?? "name"}
              disabled={disabled}
              limit={limit}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
