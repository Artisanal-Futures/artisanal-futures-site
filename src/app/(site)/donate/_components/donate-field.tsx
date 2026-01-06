"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { NumericFormat } from "react-number-format";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

export function DonateField({
  amount,
  onAmountChange,
}: {
  amount: number | null;
  onAmountChange: (amount: number | null) => void;
}) {
  const [localAmount, setLocalAmount] = useState<number | null>(amount);
  const [error, setError] = useState<string | null>(null);

  // Sync with parent when parent clears it (preset selected)
  useEffect(() => {
    if (amount === null) {
      setLocalAmount(null);
    }
  }, [amount]);

  const MIN_AMOUNT = 1;
  const MAX_AMOUNT = 100000;
  const STEP = 5;

  const validateAmount = (value: number | null): string | null => {
    if (value === null || isNaN(value)) {
      return null; // Don't show error for empty field
    }
    if (value < MIN_AMOUNT) {
      return `Minimum donation is $${MIN_AMOUNT}`;
    }
    if (value > MAX_AMOUNT) {
      return `Maximum donation is $${MAX_AMOUNT.toLocaleString()}`;
    }
    return null;
  };

  const handleAmountChange = (values: { floatValue: number | undefined }) => {
    const newAmount = values.floatValue ?? null;
    setLocalAmount(newAmount);
    const validationError = validateAmount(newAmount);
    setError(validationError);
    onAmountChange(newAmount);
  };

  const handleIncrement = () => {
    const current = localAmount ?? 0;
    const newAmount = current + STEP;
    const validatedAmount = Math.min(newAmount, MAX_AMOUNT);
    setLocalAmount(validatedAmount);
    const validationError = validateAmount(validatedAmount);
    setError(validationError);
    onAmountChange(validatedAmount);
  };

  const handleDecrement = () => {
    const current = localAmount ?? 0;
    const newAmount = Math.max(current - STEP, MIN_AMOUNT);
    setLocalAmount(newAmount);
    const validationError = validateAmount(newAmount);
    setError(validationError);
    onAmountChange(newAmount);
  };

  const hasValue = localAmount !== null && localAmount > 0;

  return (
    <>
      <label
        className="mb-2 block text-sm font-medium text-gray-700"
        htmlFor="custom-donation-amount"
      >
        Enter a custom donation amount
      </label>

      <div className="relative">
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-muted-foreground">$</span>
          </div>
          <NumericFormat
            value={localAmount ?? ""}
            onValueChange={handleAmountChange}
            thousandSeparator
            decimalScale={2}
            fixedDecimalScale
            allowNegative={false}
            prefix=""
            className={cn(
              "flex h-10 w-full rounded-md border py-2 pl-8 pr-20 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              hasValue
                ? "border-primary bg-primary/5"
                : "border-input bg-background",
              error && "border-destructive focus-visible:ring-destructive",
            )}
            placeholder="0.00"
          />
          <div className="absolute inset-y-0 right-0 flex flex-col border-l border-input">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-1/2 rounded-none rounded-tr-md border-b border-input"
              onClick={handleIncrement}
              disabled={localAmount !== null && localAmount >= MAX_AMOUNT}
              aria-label="Increase amount"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-1/2 rounded-none rounded-br-md"
              onClick={handleDecrement}
              disabled={localAmount !== null && localAmount <= MIN_AMOUNT}
              aria-label="Decrease amount"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
