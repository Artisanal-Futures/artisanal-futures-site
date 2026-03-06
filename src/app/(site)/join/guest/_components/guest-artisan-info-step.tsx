"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";

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

type GuestArtisanInfoStepProps = {
  formData: Partial<GuestSignupFormData>;
  onNext: (data: Partial<GuestSignupFormData>) => void;
  onBack?: () => void;
};

export function GuestArtisanInfoStep({
  formData,
  onNext,
  onBack,
}: GuestArtisanInfoStepProps) {
  const [country, setCountry] = useState(formData.country ?? "");
  const [state, setState] = useState(formData.state ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!country.trim()) {
      setError("Please enter your country");
      return;
    }

    if (!state.trim()) {
      setError("Please enter your state or province");
      return;
    }

    onNext({ country, state });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Where you&apos;re based</CardTitle>
        <CardDescription>
          Tell us which country and state or province you reside in
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
            <label htmlFor="country" className="mb-2 block text-sm font-medium">
              Country
            </label>
            <Input
              id="country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Enter your country"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="state" className="mb-2 block text-sm font-medium">
              State / Province
            </label>
            <Input
              id="state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Enter your state or province"
              required
            />
          </div>

          <div className="flex gap-3">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button type="submit" className="flex-1">
              Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
