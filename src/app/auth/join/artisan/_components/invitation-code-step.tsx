"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { useFormContext } from "react-hook-form";

import type { SignupFormData } from "~/lib/validators/onboarding";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { InputFormField } from "~/components/inputs/input-form-field";

import type { ShopPrefill } from "../../_components/artisan-signup-form-provider";
import { useArtisanSignup } from "../../_components/artisan-signup-form-provider";

export function InvitationCodeStep() {
  const form = useFormContext<SignupFormData>();
  const {
    goNext,
    didAutoAdvanceFromInvite,
    markAutoAdvancedFromInvite,
    setIsAnimating,
    setIsCodeVerified,
    applyShopPrefill,
  } = useArtisanSignup();
  const code = form.watch("invitationCode");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoVerified, setAutoVerified] = useState(false);
  const hasAutoAdvancedRef = useRef(false);

  const handleCodeVerified = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsCodeVerified(true);
      setIsAnimating(false);
    }, 500);
  }, []);
  // Auto-verify code if it's prefilled from URL
  useEffect(() => {
    if (didAutoAdvanceFromInvite) return;

    const verifyPrefilled = async () => {
      if (!code || autoVerified || hasAutoAdvancedRef.current) return;

      setIsVerifying(true);
      setError(null);

      try {
        const response = await fetch("/api/join/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invitationCode: code.toUpperCase(),
            type: "artisan",
          }),
        });

        const data = (await response.json()) as {
          error?: string;
          shop?: ShopPrefill;
        };

        if (response.ok) {
          hasAutoAdvancedRef.current = true;
          setAutoVerified(true);
          markAutoAdvancedFromInvite();
          if (data.shop) applyShopPrefill(data.shop);
          handleCodeVerified();
        } else {
          setError(data.error ?? "Invalid invitation code");
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong. Please try again.");
      } finally {
        setIsVerifying(false);
      }
    };

    void verifyPrefilled();
  }, [
    code,
    autoVerified,
    goNext,
    markAutoAdvancedFromInvite,
    didAutoAdvanceFromInvite,
    applyShopPrefill,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const valid = await form.trigger("invitationCode");
    if (!valid) return;

    const invitationCode =
      form.getValues("invitationCode")?.toUpperCase() ?? "";
    if (invitationCode) form.setValue("invitationCode", invitationCode);

    setIsVerifying(true);

    try {
      const response = await fetch("/api/join/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationCode, type: "artisan" }),
      });

      const data = (await response.json()) as {
        error?: string;
        shop?: ShopPrefill;
      };

      if (!response.ok) {
        setError(data.error ?? "Invalid invitation code");
        return;
      }

      if (data.shop) applyShopPrefill(data.shop);
      handleCodeVerified();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
          Join as an Artisan
        </h1>
        <p className="text-muted-foreground mt-2">
          Enter your invitation code to start your application
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <InputFormField
          form={form}
          name="invitationCode"
          label="Invitation Code"
          placeholder="Enter your code"
          required
          autoFocus
          autoComplete="off"
          inputClassName="text-center text-lg tracking-widest uppercase"
          onChange={(value) =>
            form.setValue("invitationCode", value.toUpperCase())
          }
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isVerifying || !code?.trim()}
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>

      <div className="border-border bg-muted/30 mt-10 rounded-xl border p-6">
        <h2 className="text-foreground font-semibold">
          Why join Artisanal Futures?
        </h2>
        <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="bg-primary/10 text-primary mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
              1
            </span>
            <span>
              Get discovered by customers who value locally made, unique goods
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary/10 text-primary mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
              2
            </span>
            <span>
              Showcase your products and services with a beautiful, dedicated
              profile
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary/10 text-primary mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
              3
            </span>
            <span>
              Connect directly with your community and grow your customer base
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground text-sm">
          {"Don't have a code? "}
          <Link
            href="/contact"
            className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
          >
            <Mail className="size-3.5" />
            Contact us to apply
          </Link>
        </p>
      </div>
    </div>
  );
}
