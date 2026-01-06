"use client";

import { cn } from "~/utils/styles";

import type { ButtonProps } from "~/components/ui/button";
import { Button } from "~/components/ui/button";

export default function DonateButton({
  amount,
  className,
  variant = "default",
  label = "Donate",
  disabled = false,
  isSelected = false,
}: {
  amount: number;
  variant?: ButtonProps["variant"];
  className?: string;
  label?: string;
  disabled?: boolean;
  isSelected?: boolean;
}) {
  const handleDonate = async () => {
    if (disabled || amount <= 0) return;

    const res = await fetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ amount: amount ?? 0 }), // Example $25 donation
    });
    const { url } = (await res.json()) as { url: string };
    window.location.href = url; // Redirect to Stripe
  };

  return (
    <Button
      onClick={handleDonate}
      variant={disabled ? "outline" : "default"}
      size="lg"
      className={cn(
        className,
        !disabled &&
          "bg-green-600 text-white shadow-md transition-shadow hover:bg-green-700 hover:shadow-lg",
      )}
      disabled={disabled || amount <= 0}
    >
      {label} $
      {amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </Button>
  );
}
