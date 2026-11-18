"use client";

import { useId } from "react";
import { Tags } from "lucide-react";

import type { RouterOutputs } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

export type MapCategoryTree = RouterOutputs["category"]["getNavigationTree"];

export type CategoryFilterProps = {
  tree: MapCategoryTree;
  /** The selected category's name; null means all. */
  selected: string | null;
  onChange: (category: string | null) => void;
  /** Shops per category under the other active filters. */
  counts: Map<string, number>;
  /** Shops per category over every shop, to hide empty categories. */
  totals: Map<string, number>;
};

/** Radix needs a non-empty value for the "All categories" option. */
const ALL_CATEGORIES = "__all";

const TYPE_GROUPS = [
  { type: "PRODUCT", label: "Products" },
  { type: "SERVICE", label: "Services" },
] as const;

const byName = <T extends { name: string }>(a: T, b: T) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

function CategoryRow({
  id,
  value,
  label,
  count,
  selected,
  indented = false,
}: {
  id: string;
  value: string;
  label: string;
  count?: number;
  selected: boolean;
  indented?: boolean;
}) {
  return (
    <div
      className={cn(
        "hover:bg-accent flex items-center gap-2.5 rounded-md px-2 py-2",
        indented && "ml-5",
      )}
    >
      <RadioGroupItem id={id} value={value} />
      <Label
        htmlFor={id}
        className={cn(
          "min-w-0 flex-1 cursor-pointer text-sm",
          count === 0 && !selected && "opacity-60",
        )}
      >
        {label}
      </Label>
      {count !== undefined && (
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
}

/** Single-select category list (popover body and mobile drawer section). */
export function CategoryList({
  tree,
  selected,
  onChange,
  counts,
  totals,
}: CategoryFilterProps) {
  const uid = useId();

  const isListed = (name: string) =>
    (totals.get(name) ?? 0) > 0 || name === selected;

  const groups = TYPE_GROUPS.map(({ type, label }) => ({
    label,
    parents: tree
      .filter((parent) => parent.type === type)
      .map((parent) => ({
        name: parent.name,
        children: parent.children
          .filter((child) => isListed(child.name))
          .sort(byName),
      }))
      .filter((parent) => isListed(parent.name) || parent.children.length > 0)
      .sort(byName),
  })).filter((group) => group.parents.length > 0);

  const row = (name: string, indented = false) => (
    <CategoryRow
      key={name}
      id={`${uid}-${name}`}
      value={name}
      label={name}
      count={counts.get(name) ?? 0}
      selected={name === selected}
      indented={indented}
    />
  );

  return (
    <RadioGroup
      aria-label="Category"
      value={selected ?? ALL_CATEGORIES}
      onValueChange={(value) =>
        onChange(value === ALL_CATEGORIES ? null : value)
      }
      className="gap-1"
    >
      <CategoryRow
        id={`${uid}-all`}
        value={ALL_CATEGORIES}
        label="All categories"
        selected={selected === null}
      />
      {groups.map((group) => (
        <div
          key={group.label}
          role="group"
          aria-label={group.label}
          className="flex flex-col gap-1"
        >
          <p className="text-muted-foreground px-2 pt-2 pb-0.5 text-xs font-semibold tracking-wide uppercase">
            {group.label}
          </p>
          {group.parents.flatMap((parent) => [
            row(parent.name),
            ...parent.children.map((child) => row(child.name, true)),
          ])}
        </div>
      ))}
    </RadioGroup>
  );
}

export function CategoryFilter(props: CategoryFilterProps) {
  const { selected } = props;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={
            selected
              ? `Filter by category, ${selected} selected`
              : "Filter by category"
          }
        >
          <Tags aria-hidden />
          Category
          {selected && <Badge className="ml-0.5 h-5 min-w-5 px-1.5">1</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[min(32rem,var(--radix-popover-content-available-height))] w-72 overflow-y-auto p-2"
      >
        <CategoryList {...props} />
      </PopoverContent>
    </Popover>
  );
}
