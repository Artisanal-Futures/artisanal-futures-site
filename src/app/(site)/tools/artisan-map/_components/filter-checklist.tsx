"use client";

import { useId } from "react";
import { X } from "lucide-react";

import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

export type FilterChecklistProps<T extends string> = {
  options: readonly T[];
  selected: readonly T[];
  onToggle: (option: T, checked: boolean) => void;
  /** Matches per option under the other active filters. */
  counts?: Map<T, number>;
  /** Names the group for assistive tech, e.g. "Can offer". */
  label?: string;
};

/** Multi-select checkboxes with facet counts; zero-count rows fade. */
export function FilterChecklist<T extends string>({
  options,
  selected,
  onToggle,
  counts,
  label,
}: FilterChecklistProps<T>) {
  const uid = useId();
  return (
    <div
      role={label ? "group" : undefined}
      aria-label={label}
      className="flex flex-col gap-1"
    >
      {options.map((option, i) => {
        const id = `${uid}-${i}`;
        const isSelected = selected.includes(option);
        const count = counts?.get(option);
        return (
          <div
            key={option}
            className="hover:bg-accent flex items-center gap-2.5 rounded-md px-2 py-2"
          >
            <Checkbox
              id={id}
              checked={isSelected}
              onCheckedChange={(checked) => onToggle(option, checked === true)}
            />
            <Label
              htmlFor={id}
              className={cn(
                "flex-1 cursor-pointer text-sm",
                count === 0 && !isSelected && "opacity-60",
              )}
            >
              {option}
            </Label>
            {count !== undefined && (
              <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                {count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active filter chips
// ---------------------------------------------------------------------------

export type ActiveFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

/** Removable chips for the filters currently narrowing the list. */
export function ActiveFilterChips({ chips }: { chips: ActiveFilterChip[] }) {
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key}>
          <Badge variant="secondary" className="gap-0.5 pr-0.5">
            {chip.label}
            <button
              type="button"
              aria-label={`Remove filter: ${chip.label}`}
              onClick={chip.onRemove}
              className="hover:bg-foreground/10 focus-visible:ring-ring/50 inline-flex size-4 items-center justify-center rounded-full outline-none focus-visible:ring-[3px]"
            >
              <X className="size-3" aria-hidden />
            </button>
          </Badge>
        </li>
      ))}
    </ul>
  );
}
