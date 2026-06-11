"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import type { HCaptchaHandle } from "~/components/inputs/hcaptcha-form-field";
import { HCaptchaField } from "~/components/inputs/hcaptcha-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { Alert, AlertDescription } from "~/components/ui/alert";
import type { AdminSignupFormData } from "~/lib/validators/onboarding";
import { api } from "~/trpc/react";

import { WizardFooter } from "../../_components/wizard-footer";
import { useAdminSignup } from "./admin-signup-form-provider";

const ACCOUNT_FIELDS: (keyof AdminSignupFormData)[] = [
  "name",
  "email",
  "password",
  "confirmPassword",
];

export function AdminAccountDetailsStep() {
  const form = useFormContext<AdminSignupFormData>();
  const { goBack, currentStep } = useAdminSignup();
  const captchaRef = useRef<HCaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const router = useRouter();

  const adminCreate = api.onboarding.onboardAdmin.useMutation({
    onSuccess: (data) => {
      toast.dismiss();
      toast.success(data.message ?? "Welcome to the platform!");
      setCaptchaToken("");
      const handle = captchaRef.current;
      if (handle) handle.reset();
      router.push(data.redirectUrl);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to onboard admin");
    },
    onMutate: () => {
      toast.loading("Hold on... we're setting up your account!");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const valid = await form.trigger(ACCOUNT_FIELDS);
    if (!valid) return;

    const values = form.getValues();

    if (!values.email || !values.password || !values.name) {
      toast.error(
        "Missing account details. Please complete the form.",
      );
      return;
    }

    const invitationCode = values.invitationCode?.trim().toUpperCase() ?? "";

    setIsCreatingAccount(true);
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
      const handle = captchaRef.current;
      if (handle) handle.reset();
      setCaptchaToken("");
      setIsCreatingAccount(false);
      return;
    }

    setIsCreatingAccount(false);

    adminCreate.mutate({
      invitationCode: values.invitationCode ?? "",
    });
  };

  const isPending = adminCreate.isPending || isCreatingAccount;

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div
          key={currentStep}
          className="animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="mb-8">
            <h2 className="text-foreground text-xl font-semibold sm:text-2xl">
              Create your admin account
            </h2>
            <p className="text-muted-foreground mt-2">
              {
                "Set up your account details to get access to the admin dashboard."
              }
            </p>
          </div>

          <div className="space-y-4">
            {adminCreate.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {adminCreate.error?.message ??
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
            <HCaptchaField
              ref={captchaRef}
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken("")}
              onError={() => setCaptchaToken("")}
              label="Verification"
              required
            />
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
