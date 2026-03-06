"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import type { GuestSignupFormData } from "./guest-form-types";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";

type GuestInvitationCodeStepProps = {
  formData: Partial<GuestSignupFormData>;
  onNext: (data: Partial<GuestSignupFormData>) => void;
  onBack?: () => void;
  skipAutoVerify?: boolean;
  onAutoAdvanced?: () => void;
};

export function GuestInvitationCodeStep({
  formData,
  onNext,
  skipAutoVerify,
  onAutoAdvanced,
}: GuestInvitationCodeStepProps) {
  const [code, setCode] = useState(formData.invitationCode ?? "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoVerified, setAutoVerified] = useState(false);
  const hasAutoAdvancedRef = useRef(false);

  useEffect(() => {
    if (skipAutoVerify) return;

    const verifyPrefilled = async () => {
      if (!code || autoVerified || code !== formData.invitationCode) {
        return;
      }
      if (hasAutoAdvancedRef.current) return;

      setIsVerifying(true);
      setError(null);

      try {
        const response = await fetch("/api/join/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationCode: code, type: "guest" }),
        });

        const data = (await response.json()) as { error?: string };

        if (response.ok) {
          hasAutoAdvancedRef.current = true;
          setAutoVerified(true);
          onAutoAdvanced?.();
          onNext({ invitationCode: code });
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
  }, [code, formData.invitationCode, autoVerified, onNext, onAutoAdvanced, skipAutoVerify]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    try {
      const response = await fetch("/api/join/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationCode: code, type: "guest" }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Invalid invitation code");
        return;
      }

      onNext({ invitationCode: code });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Welcome! Let&apos;s get started</CardTitle>
        <CardDescription>
          Enter your invitation code to join as a guest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <label htmlFor="code" className="mb-2 block text-sm font-medium">
              Invitation Code
            </label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter your code"
              required
              className="uppercase"
              autoFocus
            />
            <p className="mt-2 text-sm text-gray-500">
              Don&apos;t have a code? Contact us to request access.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isVerifying || !code}
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
      </CardContent>
    </Card>
  );
}
