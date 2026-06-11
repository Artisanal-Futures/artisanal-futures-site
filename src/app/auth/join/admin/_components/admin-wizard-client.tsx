"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "~/lib/utils";

import { WizardSignupProgress } from "../../_components/wizard-signup-progress";
import { AdminAccountDetailsStep } from "./admin-account-details-step";
import { AdminInvitationCodeStep } from "./admin-invitation-code-step";
import {
  AdminSignupFormProvider,
  useAdminSignup,
} from "./admin-signup-form-provider";

export type { AdminSignupFormData } from "~/lib/validators/onboarding";

const STEPS = [{ id: "account", label: "Account" }];

function AdminWizardContent() {
  const { currentStep, isAnimating, isCodeVerified, progress } =
    useAdminSignup();

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
                &quot; Artisanal Futures is built by people who care about
                supporting local makers and sustainable craft communities.&quot;
              </p>
              <footer className="text-primary-foreground/70 text-sm">
                — The Artisanal Futures Collective
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
            <AdminInvitationCodeStep />
          </div>
          <div className="text-muted-foreground border-t p-4 text-center text-xs">
            By creating an account, you agree to our{" "}
            <Link
              href="/legal/terms-of-use"
              className="text-primary hover:underline"
            >
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Wizard view (full width) — single account step
  return (
    <div className="bg-background flex min-h-svh flex-col">
      {/* Header */}
      <WizardSignupProgress
        currentStep={currentStep}
        steps={STEPS}
        progress={progress}
      />

      {/* Content */}
      <>{currentStep === 0 && <AdminAccountDetailsStep />}</>
    </div>
  );
}

type AdminWizardClientProps = {
  initialCode?: string;
};

export function AdminWizardClient({ initialCode }: AdminWizardClientProps) {
  return (
    <AdminSignupFormProvider initialCode={initialCode}>
      <AdminWizardContent />
    </AdminSignupFormProvider>
  );
}
