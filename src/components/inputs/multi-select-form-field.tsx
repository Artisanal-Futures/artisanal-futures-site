"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "~/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
  CommandEmpty,
} from "~/components/ui/command";
import { Badge } from "~/components/ui/badge";

export type OptionType = { label: string; value: string };

interface MultiSelectFormFieldProps {
  options: OptionType[];
  selected: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder?: string;
  className?: string;
}

export function MultiSelectFormField({
  options,
  selected,
  onChange,
  className,
  placeholder = "Select...",
}: MultiSelectFormFieldProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
    setOpen(true);
  };

  const handleUnselect = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex flex-wrap gap-1 text-left">
            {selected.length > 0 ? (
              selected.map((value) => {
                const item = options.find((o) => o.value === value);
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(value);
                    }}
                    className="cursor-pointer"
                  >
                    {item?.label ?? value}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                );
              })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        className="w-[--radix-popover-trigger-width] p-0 z-[9999]"
      >
        <Command className={className}>
          <CommandInput placeholder="Search..." />
          <CommandList className="max-h-64 overflow-y-auto">
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandEmpty>No options found.</CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}