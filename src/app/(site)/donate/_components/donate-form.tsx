"use client";

import { useMemo, useState } from "react";

import { cn } from "~/lib/utils";
import { ButtonGroup } from "~/components/ui/button-group";
import { Checkbox } from "~/components/ui/checkbox";

import DonateButton from "./donate-button";
import { DonateField } from "./donate-field";
import { SocialShareButtons } from "./social-share-buttons";

export function DonateForm() {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [coverFees, setCoverFees] = useState(false);

  const presetAmounts = [5, 10, 20, 50];

  // Use whichever is set (preset takes precedence if both somehow set)
  const selectedAmount = selectedPreset ?? customAmount;

  const isValidAmount =
    selectedAmount !== null && selectedAmount >= 1 && selectedAmount <= 100000;

  // Calculate fee amount and total amount to charge
  const { feeAmount, totalAmount } = useMemo(() => {
    if (!selectedAmount || selectedAmount <= 0) {
      return { feeAmount: 0, totalAmount: 0 };
    }

    // Always calculate the fee amount (for display)
    // Formula: (N + 0.30) / 0.971 to cover Stripe's 2.9% + $0.30 fee
    const total = (selectedAmount + 0.3) / 0.971;
    const fee = total - selectedAmount;
    const calculatedFee = Math.round(fee * 100) / 100; // Round to 2 decimal places
    const calculatedTotal = Math.round(total * 100) / 100;

    if (coverFees) {
      return {
        feeAmount: calculatedFee,
        totalAmount: calculatedTotal,
      };
    }

    return {
      feeAmount: calculatedFee, // Always show the fee amount
      totalAmount: selectedAmount, // Only add fee if checkbox is checked
    };
  }, [selectedAmount, coverFees]);

  const handlePresetClick = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount(null); // Clear custom field when preset is selected
  };

  const handleCustomChange = (amount: number | null) => {
    setCustomAmount(amount);
    // Only clear preset if user is entering a custom amount (not when clearing)
    if (amount !== null) {
      setSelectedPreset(null);
    }
  };

  return (
    <div className="bg-card mt-6 flex flex-col rounded-lg border p-6 shadow-sm lg:mt-0 lg:p-8">
      <h2 className="mb-6 text-xl font-semibold tracking-tight">
        Choose your donation amount
      </h2>

      <ButtonGroup className="w-full max-w-full">
        {presetAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => handlePresetClick(amount)}
            className={cn(
              "flex-1 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
              selectedPreset === amount
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
            )}
          >
            $
            {amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </button>
        ))}
      </ButtonGroup>

      <div className="my-6 flex items-center">
        <div className="bg-border h-px grow"></div>
        <span className="text-muted-foreground mx-3 text-sm font-medium">
          or
        </span>
        <div className="bg-border h-px grow"></div>
      </div>

      <DonateField amount={customAmount} onAmountChange={handleCustomChange} />

      {isValidAmount && (
        <div className="mt-5 flex items-start space-x-3">
          <Checkbox
            id="cover-fees"
            checked={coverFees}
            onCheckedChange={(checked) => setCoverFees(checked === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="cover-fees"
            className="cursor-pointer text-sm leading-relaxed font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I&apos;ll generously add $
            {feeAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            to cover the transaction fees so you can keep 100% of my donation.
          </label>
        </div>
      )}

      <div className="mt-6">
        <DonateButton
          amount={isValidAmount ? totalAmount : 0}
          disabled={!isValidAmount}
          className="w-full"
          label="Donate"
        />
      </div>

      <p className="text-muted-foreground mt-6 text-sm">
        <span className="inline-flex items-center gap-1">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          You&apos;ll be securely redirected to Stripe to complete your
          donation.
        </span>
      </p>

      <div className="mt-8 border-t pt-6">
        <p className="text-foreground mb-3 text-sm font-medium">
          Share this cause:
        </p>
        <SocialShareButtons />
      </div>
    </div>
  );
}
