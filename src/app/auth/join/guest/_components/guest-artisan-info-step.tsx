"use client";

import { useFormContext } from "react-hook-form";

import type { GuestSignupFormData } from "~/lib/validators/onboarding";
import { InputFormField } from "~/components/inputs/input-form-field";

import { WizardFooter } from "../../_components/wizard-footer";
import { useGuestSignup } from "./guest-signup-form-provider";

const LOCATION_FIELDS: (keyof GuestSignupFormData)[] = ["country", "state"];

export function GuestArtisanInfoStep() {
  const form = useFormContext<GuestSignupFormData>();
  const { goNext, goBack, currentStep } = useGuestSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = await form.trigger(LOCATION_FIELDS);
    if (valid) goNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div
          key={currentStep}
          className="animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="mb-8">
            <h2 className="text-foreground text-xl font-semibold sm:text-2xl">
              Where you&apos;re based
            </h2>
            <p className="text-muted-foreground mt-2">
              Tell us which country and state or province you reside in
            </p>
          </div>

          <div className="space-y-6">
            <InputFormField
              form={form}
              name="country"
              label="Country"
              placeholder="Enter your country"
              required
              autoFocus
            />
            <InputFormField
              form={form}
              name="state"
              label="State / Province"
              placeholder="Enter your state or province"
              required
            />
          </div>
        </div>
      </div>

      {/* Footer navigation */}

      <WizardFooter goBack={goBack} currentStep={currentStep} />
    </form>
  );
}
