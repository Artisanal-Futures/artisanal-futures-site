"use client";

import { useFormContext } from "react-hook-form";

import type { GuestSignupFormData } from "~/lib/validators/onboarding";
import { InputFormField } from "~/components/inputs/input-form-field";

import { WizardFooter } from "../../_components/wizard-footer";
import { useGuestSignup } from "./guest-signup-form-provider";

const ACCOUNT_FIELDS: (keyof GuestSignupFormData)[] = [
  "name",
  "email",
  "password",
  "confirmPassword",
];

export function GuestAccountDetailsStep() {
  const form = useFormContext<GuestSignupFormData>();
  const { goNext, goBack, currentStep } = useGuestSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = await form.trigger(ACCOUNT_FIELDS);
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
              Create your account
            </h2>
            <p className="text-muted-foreground mt-2">
              {
                "Let's start with the basics. This information will be used to sign you in."
              }
            </p>
          </div>

          <div className="space-y-4">
            <InputFormField
              form={form}
              name="name"
              label="Full Name"
              placeholder="John Doe"
              required
              autoFocus
            />
            <InputFormField
              form={form}
              name="email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              required
            />
            <InputFormField
              form={form}
              name="password"
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              required
            />
            <InputFormField
              form={form}
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
            />
          </div>
        </div>
      </div>

      {/* Footer navigation */}
      <WizardFooter goBack={goBack} currentStep={currentStep} />
    </form>
  );
}
