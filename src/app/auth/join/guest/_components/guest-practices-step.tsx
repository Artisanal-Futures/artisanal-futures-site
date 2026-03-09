"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import type { HCaptchaHandle } from "~/components/inputs/hcaptcha-form-field";
import { HCaptchaField } from "~/components/inputs/hcaptcha-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import type { GuestSignupFormData } from "~/lib/validators/onboarding";
import { api } from "~/trpc/react";

import { WizardFooter } from "../../_components/wizard-footer";
import { useGuestSignup } from "./guest-signup-form-provider";

const ARTISANAL_PRACTICES = [
  { value: "cloth", label: "Cloth designer" },
  { value: "bag", label: "Bag Designer" },
  { value: "both", label: "Cloth and Bag Designer" },
  { value: "other", label: "Others" },
] as const;

const PRACTICES_FIELD_NAMES: (keyof GuestSignupFormData)[] = [
  "artisanalPractice",
  "otherPractice",
];

export function GuestPracticesStep() {
  const form = useFormContext<GuestSignupFormData>();
  const { goBack, currentStep } = useGuestSignup();
  const artisanalPractice = form.watch("artisanalPractice");

  const captchaRef = useRef<HCaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const router = useRouter();

  const guestCreate = api.onboarding.onboardGuest.useMutation({
    onSuccess: (data) => {
      toast.dismiss();
      toast.success(data.message ?? "Welcome to the platform!");
      setCaptchaToken("");
      const handle = captchaRef.current;
      if (handle) handle.reset();
      router.push("/join/welcome");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to onboard guest");
    },
    onMutate: () => {
      toast.loading("Hold on... we're onboarding you!");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const valid = await form.trigger(PRACTICES_FIELD_NAMES);
    if (!valid) return;

    const values = form.getValues();

    if (!values.email || !values.password || !values.name) {
      toast.error(
        "Missing account details. Please go back and complete the form.",
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

    guestCreate.mutate({
      name: values.name,
      country: values.country,
      state: values.state,
      artisanalPractice: values.artisanalPractice,
      otherPractice:
        values.artisanalPractice === "other"
          ? (values.otherPractice ?? "")
          : "",
      email: values.email,
      invitationCode: values.invitationCode ?? "",
    });
  };

  const isPending = guestCreate.isPending || isCreatingAccount;

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div
          key={currentStep}
          className="animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="mb-8">
            <h2 className="text-foreground text-xl font-semibold sm:text-2xl">
              Artisanal practices
            </h2>
            <p className="text-muted-foreground mt-2">
              Which best describes your artisanal practice?
            </p>
          </div>

          <div className="space-y-6">
            {guestCreate.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {guestCreate.error?.message ??
                    "Something went wrong. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="artisanalPractice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artisanal Practices</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col gap-2"
                    >
                      {ARTISANAL_PRACTICES.map(({ value, label }) => (
                        <div
                          key={value}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem value={value} id={value} />
                          <FormLabel
                            htmlFor={value}
                            className="cursor-pointer font-normal"
                          >
                            {label}
                          </FormLabel>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {artisanalPractice === "other" && (
              <InputFormField
                form={form}
                name="otherPractice"
                label="Other practice"
                placeholder="Enter your artisanal practice"
              />
            )}
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

      {/* Footer navigation */}

      <WizardFooter
        isPending={isPending}
        isSubmitButton={true}
        goBack={goBack}
        currentStep={currentStep}
      />
    </form>
  );
}
