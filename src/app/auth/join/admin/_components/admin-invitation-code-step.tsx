"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Mail } from "lucide-react";
import { useFormContext } from "react-hook-form";

import type { AdminSignupFormData } from "~/lib/validators/onboarding";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { InputFormField } from "~/components/inputs/input-form-field";

import { useAdminSignup } from "./admin-signup-form-provider";

export function AdminInvitationCodeStep() {
  const form = useFormContext<AdminSignupFormData>();
  const {
    didAutoAdvanceFromInvite,
    markAutoAdvancedFromInvite,
    setIsAnimating,
    setIsCodeVerified,
  } = useAdminSignup();
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
  }, [setIsAnimating, setIsCodeVerified]);

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
            type: "admin",
          }),
        });

        const data = (await response.json()) as { error?: string };

        if (response.ok) {
          hasAutoAdvancedRef.current = true;
          setAutoVerified(true);
          markAutoAdvancedFromInvite();
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
    markAutoAdvancedFromInvite,
    didAutoAdvanceFromInvite,
    handleCodeVerified,
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
        body: JSON.stringify({ invitationCode, type: "admin" }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Invalid invitation code");
        return;
      }

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
          Join as an Admin
        </h1>
        <p className="text-muted-foreground mt-2">
          Enter your invitation code to create your admin account
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
        <h2 className="text-foreground font-semibold">Admin access</h2>
        <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="bg-primary/10 text-primary mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
              1
            </span>
            <span>Manage artisan and guest invitations to the platform</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary/10 text-primary mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
              2
            </span>
            <span>Review and manage products, services, and shops</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary/10 text-primary mt-1 flex size-5 shrink-0 items-center justify-center rounded-full text-xs">
              3
            </span>
            <span>Access surveys, events, and platform content</span>
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
