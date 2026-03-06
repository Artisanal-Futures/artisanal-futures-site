"use client";

import { useState } from "react";

import { AccountDetailsStep } from "./account-details-step";
import { ArtisanProfileStep } from "./artisan-profile-step";
import { BusinessInfoStep } from "./business-info-step";
import { InvitationCodeStep } from "./invitation-code-step";
import { SignupProgress } from "./signup-progress";

export type SignupFormData = {
  // Invitation
  invitationCode: string;

  // Account
  email: string;
  password: string;
  name: string;

  // Business
  businessName: string;
  businessInterview: string;
  businessLocation?: string;
  businessEmail?: string;
  businessTelephone?: string;
  businessType: string[];
  businessTypeOther?: string;
  productCategories: string[];
  productCategoriesOther?: string;
  principles: string[];
  principlesOther?: string;
  commonProcesses: string[];
  commonProcessesOther?: string;
  materialsUsed: string[];
  materialsUsedOther?: string;
  websiteLink?: string;
  socialMediaLinks?: string;

  // Artisan profile
  ownerName: string;
  ownerBio?: string;
  publicDescription: string;
  logoFile?: File | null;
  ownerPhotoFile?: File | null;
  logoPhotoUrl?: string;
  ownerPhotoUrl?: string;
};

const STEPS = [
  { id: 1, name: "Invitation", component: InvitationCodeStep },
  { id: 2, name: "Account", component: AccountDetailsStep },
  { id: 3, name: "Business", component: BusinessInfoStep },
  { id: 4, name: "Artisan profile", component: ArtisanProfileStep },
] as const;

type WizardClientProps = {
  initialCode?: string;
};

export function WizardClient({ initialCode }: WizardClientProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [didAutoAdvanceFromInvite, setDidAutoAdvanceFromInvite] =
    useState(false);
  const [formData, setFormData] = useState<Partial<SignupFormData>>({
    invitationCode: initialCode?.toUpperCase(),
  });

  const CurrentStepComponent = STEPS[currentStep - 1]?.component ?? null;

  const handleNext = (data: Partial<SignupFormData>) => {
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
      {/* Progress Indicator */}
      <div className="border-border/50 rounded-t-md border bg-white">
        <div className="container mx-auto px-4 py-6">
          <SignupProgress currentStep={currentStep} steps={STEPS} />
        </div>
      </div>

      {/* Form Content */}
      <section className="container mx-auto flex flex-1 items-center justify-center px-4 py-8 shadow">
        <div className="flex w-full max-w-6xl justify-center">
          {currentStep === 1 ? (
            <InvitationCodeStep
              formData={formData}
              onNext={handleNext}
              onBack={undefined}
              skipAutoVerify={didAutoAdvanceFromInvite}
              onAutoAdvanced={() => setDidAutoAdvanceFromInvite(true)}
            />
          ) : CurrentStepComponent ? (
            <CurrentStepComponent
              formData={formData}
              onNext={handleNext}
              onBack={handleBack}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
