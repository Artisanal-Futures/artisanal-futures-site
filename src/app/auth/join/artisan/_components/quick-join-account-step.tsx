"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Info } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import type { SignupFormData } from "~/lib/validators/onboarding";
import { InputFormField } from "~/components/inputs/input-form-field";
import { RecaptchaDisclosure } from "~/components/inputs/recaptcha-disclosure";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useRecaptchaV3 } from "~/lib/captcha/use-recaptcha-v3";
import { navigateTo } from "~/lib/upcy";
import { api } from "~/trpc/react";

import { useArtisanSignup } from "../../_components/artisan-signup-form-provider";
import { WizardFooter } from "../../_components/wizard-footer";

const ACCOUNT_FIELDS: (keyof SignupFormData)[] = [
  "name",
  "email",
  "password",
  "confirmPassword",
];

/**
 * Single-step signup for invites that skip onboarding: create the account,
 * then claim the invite (and its shop, if any).
 */
export function QuickJoinAccountStep() {
  const form = useFormContext<SignupFormData>();
  const { goBack, currentStep, attachedShop } = useArtisanSignup();
  const { execute } = useRecaptchaV3();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const router = useRouter();

  const claimInvite = api.onboarding.claimArtisanInvite.useMutation({
    onSuccess: (data, _input, context) => {
      toast.success(data.message ?? "Welcome to the platform!", {
        id: context?.toastId,
      });
      navigateTo(data.redirectUrl, router);
    },
    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to finish setting up your account", {
        id: context?.toastId,
      });
    },
    onMutate: () => ({
      toastId: toast.loading("Hold on... we're setting up your account!"),
    }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const valid = await form.trigger(ACCOUNT_FIELDS);
    if (!valid) return;

    const values = form.getValues();

    if (!values.email || !values.password || !values.name) {
      toast.error("Missing account details. Please complete the form.");
      return;
    }

    const invitationCode = values.invitationCode?.trim().toUpperCase() ?? "";

    setIsCreatingAccount(true);
    const captchaToken = (await execute("signup")) ?? "";
    const signUpRes = await fetch("/api/auth/sign-up-with-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: values.email,
        password: values.password,
        name: values.name,
        invitationCode,
        captchaToken,
      }),
    });

    if (!signUpRes.ok) {
      const data = (await signUpRes.json().catch(() => ({}))) as {
        message?: string;
      };
      toast.error(data.message ?? "Something went wrong. Please try again.");
      setIsCreatingAccount(false);
      return;
    }

    setIsCreatingAccount(false);

    claimInvite.mutate({ invitationCode });
  };

  const isPending = claimInvite.isPending || isCreatingAccount;

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

            {attachedShop && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {"You're taking ownership of "}
                  <strong className="text-foreground font-medium">
                    {attachedShop.name}
                  </strong>
                  {". Your shop is already set up — just create your account."}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-4">
            {claimInvite.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {claimInvite.error?.message ??
                    "Something went wrong. Please try again."}
                </AlertDescription>
              </Alert>
            )}

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
            <RecaptchaDisclosure />
          </div>
        </div>
      </div>

      <WizardFooter
        isPending={isPending}
        isSubmitButton={true}
        goBack={goBack}
        currentStep={currentStep}
      />
    </form>
  );
}
