"use client";

import { useState } from "react";

import { GuestAccountDetailsStep } from "./guest-account-details-step";
import { GuestArtisanInfoStep } from "./guest-artisan-info-step";
import { GuestInvitationCodeStep } from "./guest-invitation-code-step";
import { GuestPracticesStep } from "./guest-practices-step";
import { GuestSignupProgress } from "./guest-signup-progress";

export type { GuestSignupFormData } from "./guest-form-types";

const STEPS = [
  { id: 1, name: "Invitation", component: GuestInvitationCodeStep },
  { id: 2, name: "Account", component: GuestAccountDetailsStep },
  { id: 3, name: "Location", component: GuestArtisanInfoStep },
  { id: 4, name: "Practices", component: GuestPracticesStep },
] as const;

type GuestWizardClientProps = {
  initialCode?: string;
};

export function GuestWizardClient({ initialCode }: GuestWizardClientProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<
    Partial<import("./guest-form-types").GuestSignupFormData>
  >({
    invitationCode: initialCode?.toUpperCase(),
  });

  const CurrentStepComponent = STEPS[currentStep - 1]?.component ?? null;

  const handleNext = (
    data: Partial<import("./guest-form-types").GuestSignupFormData>,
  ) => {
    setFormData((prev) => ({ ...prev, ...data }));

    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex min-h-[50svh] flex-col bg-gray-50">
      <div className="border-border/50 rounded-t-md border bg-white">
        <div className="container mx-auto px-4 py-6">
          <GuestSignupProgress currentStep={currentStep} steps={STEPS} />
        </div>
      </div>

      <section className="container mx-auto flex flex-1 items-center justify-center px-4 py-8 shadow">
        <div className="flex w-full max-w-6xl justify-center">
          {CurrentStepComponent ? (
            <CurrentStepComponent
              formData={formData}
              onNext={handleNext}
              onBack={currentStep > 1 ? handleBack : undefined}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
