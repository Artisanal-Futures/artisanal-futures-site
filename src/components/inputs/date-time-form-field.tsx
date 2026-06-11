"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import * as React from "react";
import { format, setHours, setMinutes, setSeconds } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

type Props<CurrentForm extends FieldValues> = {
  form: UseFormReturn<CurrentForm>;
  name: Path<CurrentForm>;
  label?: string;
  dateLabel?: string;
  timeLabel?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  labelClassName?: string;
  /** Default time when only date is set (HH:mm:ss). Default "00:00:00" */
  defaultTime?: string;
};

function parseTimeString(timeStr: string): { h: number; m: number; s: number } {
  const parts = timeStr.split(":").map(Number);
  return {
    h: parts[0] ?? 0,
    m: parts[1] ?? 0,
    s: parts[2] ?? 0,
  };
}

function toTimeString(date: Date): string {
  return format(date, "HH:mm:ss");
}

export function DateTimeFormField<CurrentForm extends FieldValues>({
  form,
  name,
  label,
  dateLabel = "Date",
  timeLabel = "Time",
  description,
  className,
  disabled,
  required,
  labelClassName,
  defaultTime = "00:00:00",
}: Props<CurrentForm>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <DateTimeFormFieldInner
          field={field}
          label={label}
          dateLabel={dateLabel}
          timeLabel={timeLabel}
          description={description}
          className={className}
          disabled={disabled}
          required={required}
          labelClassName={labelClassName}
          defaultTime={defaultTime}
        />
      )}
    />
  );
}

type DateTimeFormFieldInnerProps<CurrentForm extends FieldValues> = {
  field: {
    value: Date | undefined;
    onChange: (value: Date | undefined) => void;
  };
  label?: string;
  dateLabel: string;
  timeLabel: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  labelClassName?: string;
  defaultTime: string;
};

function DateTimeFormFieldInner<CurrentForm extends FieldValues>({
  field,
  label,
  dateLabel,
  timeLabel,
  description,
  className,
  disabled,
  required,
  labelClassName,
  defaultTime,
}: DateTimeFormFieldInnerProps<CurrentForm>) {
  const [open, setOpen] = React.useState(false);
  const value = field.value;

  const dateOnly = value
    ? new Date(value.getFullYear(), value.getMonth(), value.getDate())
    : undefined;
  const timeStr = value ? toTimeString(value) : defaultTime;

  const updateDateTime = (newDate: Date | undefined, newTime: string) => {
    if (!newDate) {
      field.onChange(undefined);
      return;
    }
    const { h, m, s } = parseTimeString(newTime);
    const combined = setSeconds(
      setMinutes(setHours(new Date(newDate), h), m),
      s,
    );
    field.onChange(combined);
  };

  return (
    <FormItem className={cn("col-span-full", className)}>
      {label && (
        <FormLabel className={cn(labelClassName)}>
          {label}
          {required && " *"}
        </FormLabel>
      )}
      <FormControl>
        <FieldGroup
          dateLabel={dateLabel}
          timeLabel={timeLabel}
          disabled={disabled}
          dateOnly={dateOnly}
          timeStr={timeStr}
          defaultTime={defaultTime}
          open={open}
          setOpen={setOpen}
          onDateChange={(date) => updateDateTime(date ?? undefined, timeStr)}
          onTimeChange={(time) =>
            updateDateTime(
              dateOnly ?? new Date(new Date().setHours(0, 0, 0, 0)),
              time,
            )
          }
        />
      </FormControl>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}

type FieldGroupProps = {
  dateLabel: string;
  timeLabel: string;
  disabled?: boolean;
  dateOnly: Date | undefined;
  timeStr: string;
  defaultTime: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
};

function FieldGroup({
  dateLabel,
  timeLabel,
  disabled,
  dateOnly,
  timeStr,
  defaultTime,
  open,
  setOpen,
  onDateChange,
  onTimeChange,
}: FieldGroupProps) {
  return (
    <div className="flex flex-row flex-wrap items-end gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm leading-none font-medium">{dateLabel}</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className="w-[200px] justify-between font-normal"
            >
              {dateOnly ? format(dateOnly, "PPP") : "Select date"}
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={dateOnly}
              defaultMonth={dateOnly}
              onSelect={(date) => {
                onDateChange(date ?? undefined);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm leading-none font-medium">{timeLabel}</span>
        <Input
          type="time"
          step="1"
          disabled={disabled}
          value={timeStr}
          onChange={(e) => onTimeChange(e.target.value || defaultTime)}
          className="bg-background w-32 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
