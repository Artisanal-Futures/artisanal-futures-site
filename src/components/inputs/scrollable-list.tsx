"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
import { CommandGroup, CommandItem } from "~/components/ui/command";

export type OptionType = { label: string; value: string };

interface ScrollableListProps {
  options: OptionType[];
  selected: string[];
  onSelect: (value: string) => void;
  className?: string;
}

export const ScrollableList = React.memo(function ScrollableList({
  options,
  selected,
  onSelect,
  className,
}: ScrollableListProps) {
  console.log("Rendered ScrollableList");

  return (
    <div
      cmdk-list
      role="listbox"
      aria-label="Selectable categories"
      className={cn("max-h-[300px] overflow-y-auto", className)}
      style={{ maxHeight: 300, overflowY: "auto" }}
    >
      <CommandGroup>
        {options.map((option) => (
          <CommandItem
            key={option.value}
            onSelect={() => onSelect(option.value)}
            role="option"
            aria-selected={selected.includes(option.value)}
            tabIndex={-1}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                selected.includes(option.value) ? "opacity-100" : "opacity-0"
              )}
            />
            {option.label}
          </CommandItem>
        ))}
      </CommandGroup>
    </div>
  );
});
