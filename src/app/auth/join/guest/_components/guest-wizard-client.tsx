"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "~/lib/utils";

import { WizardSignupProgress } from "../../_components/wizard-signup-progress";
import { GuestAccountDetailsStep } from "./guest-account-details-step";
import { GuestArtisanInfoStep } from "./guest-artisan-info-step";
import { GuestInvitationCodeStep } from "./guest-invitation-code-step";
import { GuestPracticesStep } from "./guest-practices-step";
import {
  GuestSignupFormProvider,
  useGuestSignup,
} from "./guest-signup-form-provider";

export type { GuestSignupFormData } from "~/lib/validators/onboarding";

const STEPS = [
  { id: "account", label: "Account" },
  { id: "location", label: "Location" },
  { id: "practices", label: "Practices" },
];

function GuestWizardContent() {
  const { currentStep, isAnimating, isCodeVerified, progress } =
    useGuestSignup();
  // Code entry view (split layout)
  if (!isCodeVerified) {
    return (
      <div
        className={cn(
          "grid min-h-svh transition-all duration-500 ease-out",
          isAnimating ? "lg:grid-cols-1" : "lg:grid-cols-2",
        )}
      >
        {/* Left panel - Image + branding */}
        <div
          className={cn(
            "bg-primary relative hidden flex-col justify-between overflow-hidden p-10 transition-all duration-500 ease-out lg:flex",
            isAnimating && "lg:hidden",
          )}
        >
          <Image
            src="/placeholder.svg"
            alt="Artisan at work"
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="relative z-10">
            <Link
              href="/"
              className="text-primary-foreground flex w-fit items-center gap-2 transition-opacity hover:opacity-80"
            >
              <Image
                src="/logos/logo.png"
                alt="Artisanal Futures"
                width={300}
                height={120}
              />
            </Link>
          </div>
          <div className="relative z-10">
            <blockquote className="space-y-4">
              <p className="text-primary-foreground/90 text-lg leading-relaxed">
                &quot; Joining the directory was a turning point for my
                business. The exposure to local customers who truly appreciate
                handmade crafts has been incredible.&quot;
              </p>
              <footer className="text-primary-foreground/70 text-sm">
                — Jane Doe, The Artisanal Futures Collective
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Right panel - Code entry */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-6 lg:p-10">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors lg:hidden"
            >
              <Image
                src="/logos/logo.png"
                alt="Artisanal Futures"
                width={150}
                height={60}
              />
            </Link>

            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground ml-auto text-sm transition-colors"
            >
              Back to home
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center p-6 lg:p-10">
            <GuestInvitationCodeStep />
          </div>
        </div>
      </div>
    );
  }

  // Wizard view (full width)
  return (
    <div className="bg-background flex min-h-svh flex-col">
      {/* Header */}
      <WizardSignupProgress
        currentStep={currentStep}
        steps={STEPS}
        progress={progress}
      />

      {/* Content */}
      <>
        {currentStep === 0 && <GuestAccountDetailsStep />}
        {currentStep === 1 && <GuestArtisanInfoStep />}
        {currentStep === 2 && <GuestPracticesStep />}
      </>
    </div>
  );
}

type GuestWizardClientProps = {
  initialCode?: string;
};

export function GuestWizardClient({ initialCode }: GuestWizardClientProps) {
  return (
    <GuestSignupFormProvider initialCode={initialCode}>
      <GuestWizardContent />
    </GuestSignupFormProvider>
  );
}
