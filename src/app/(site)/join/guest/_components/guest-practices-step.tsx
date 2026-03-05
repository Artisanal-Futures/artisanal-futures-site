"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { GuestSignupFormData } from "./guest-form-types";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
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
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

const ARTISANAL_PRACTICES = [
  { value: "cloth", label: "Cloth designer" },
  { value: "bag", label: "Bag Designer" },
  { value: "both", label: "Cloth and Bag Designer" },
  { value: "other", label: "Others" },
] as const;

type GuestPracticesStepProps = {
  formData: Partial<GuestSignupFormData>;
  onNext?: (data: Partial<GuestSignupFormData>) => void;
  onBack?: () => void;
};

export function GuestPracticesStep({
  formData,
  onBack,
}: GuestPracticesStepProps) {
  const [artisanalPractice, setArtisanalPractice] = useState(
    formData.artisanalPractice ?? "",
  );
  const [otherPractice, setOtherPractice] = useState(
    formData.otherPractice ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guestCreate = api.guest.create.useMutation({
    onSuccess: () => {
      window.location.href = "/join/guest/welcome";
    },
    onError: (err) => {
      setIsSubmitting(false);
      setError(err.message ?? "Something went wrong. Please try again.");
      toast.error(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!artisanalPractice) {
      setError("Please select your artisanal practice");
      return;
    }

    if (artisanalPractice === "other" && !otherPractice.trim()) {
      setError("Please describe your artisanal practice");
      return;
    }

    const email = formData.email;
    const password = formData.password;
    const name = formData.name;
    const country = formData.country ?? "";
    const state = formData.state ?? "";

    if (!email || !password || !name) {
      setError("Missing account details. Please go back and complete the form.");
      return;
    }

    setIsSubmitting(true);

    const signUpCode = process.env.NEXT_PUBLIC_PASSWORD_PROTECT;

    try {
      await authClient.signUp.email({
        email,
        password,
        name,
        role: "GUEST",
        ...(signUpCode ? { code: signUpCode } : {}),
      });
    } catch (err) {
      setIsSubmitting(false);
      const message =
        err instanceof Error ? err.message : "Sign-up failed. Please try again.";
      setError(message);
      toast.error(message);
      return;
    }

    guestCreate.mutate({
      name,
      country,
      state,
      artisanalPractice,
      otherPractice: artisanalPractice === "other" ? otherPractice : "",
      email,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artisanal practices</CardTitle>
        <CardDescription>
          Which best describes your artisanal practice?
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

          <div className="space-y-2">
            <Label>Artisanal Practices</Label>
            <RadioGroup
              onValueChange={setArtisanalPractice}
              value={artisanalPractice}
            >
              {ARTISANAL_PRACTICES.map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={value} />
                  <Label htmlFor={value}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {artisanalPractice === "other" && (
            <div>
              <label
                htmlFor="otherPractice"
                className="mb-2 block text-sm font-medium"
              >
                Other practice
              </label>
              <Input
                id="otherPractice"
                type="text"
                value={otherPractice}
                onChange={(e) => setOtherPractice(e.target.value)}
                placeholder="Enter your artisanal practice"
              />
            </div>
          )}

          <div className="flex gap-3">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating your account...
                </>
              ) : (
                "Complete registration"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
