"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUploadFile } from "@better-upload/client";
import { AlertCircle } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import type { HCaptchaHandle } from "~/components/inputs/hcaptcha-form-field";
import type { SignupFormData } from "~/lib/validators/onboarding";
import { slugify } from "~/lib/utils";
import { api } from "~/trpc/react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { HCaptchaField } from "~/components/inputs/hcaptcha-form-field";
import { ImageUploadFormField } from "~/components/inputs/image-upload-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";

import { useArtisanSignup } from "../../_components/artisan-signup-form-provider";
import { WizardFooter } from "../../_components/wizard-footer";

const PROFILE_FIELD_NAMES: (keyof SignupFormData)[] = [
  "ownerName",
  "ownerBio",
  "publicDescription",
];

export function ArtisanProfileStep() {
  const form = useFormContext<SignupFormData>();
  const { goBack, currentStep } = useArtisanSignup();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const ownerPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const captchaRef = useRef<HCaptchaHandle>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const router = useRouter();

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const imageUploader = useUploadFile({
    api: "/api/upload",
    route: "onboardingImage",
    onError: (err) => {
      toast.error(err.message ?? "Image upload failed.");
    },
  });

  const onboarding = api.onboarding.onboardArtisan.useMutation({
    onSuccess: (data) => {
      toast.dismiss();
      toast.success(data.message ?? "Welcome to the platform!");
      setCaptchaToken("");
      const handle = captchaRef.current;
      if (handle) handle.reset();
      router.push(data.redirectUrl ?? "/");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to onboard artisan");
    },
    onMutate: () => {
      toast.loading("Hold on... we're onboarding you!");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const valid = await form.trigger(PROFILE_FIELD_NAMES);
    if (!valid) return;

    const values = form.getValues();

    if (!values.email || !values.password || !values.name) {
      toast.error("Please fill in all account details");
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

    const businessSlug = slugify(values.businessName ?? "");

    let logoPhotoUrl: string | undefined;
    const logoFile = values.logoFile;
    if (logoFile instanceof File) {
      try {
        const response = await imageUploader.upload(logoFile, {
          metadata: { businessSlug },
        });
        const pathname = response.file.objectInfo.metadata?.pathname as
          | string
          | undefined;
        if (pathname) logoPhotoUrl = pathname;
      } catch {
        toast.error("Failed to upload logo.");
        return;
      }
    }

    let ownerPhotoUrl: string | undefined;
    const ownerPhotoFile = values.ownerPhotoFile;
    if (ownerPhotoFile instanceof File) {
      try {
        const response = await imageUploader.upload(ownerPhotoFile, {
          metadata: { businessSlug },
        });
        const pathname = response.file.objectInfo.metadata?.pathname as
          | string
          | undefined;
        if (pathname) ownerPhotoUrl = pathname;
      } catch {
        toast.error("Failed to upload owner photo.");
        return;
      }
    }

    const completeFormData: SignupFormData = {
      ...values,
      logoFile: undefined,
      ownerPhotoFile: undefined,
      logoPhotoUrl: logoPhotoUrl ?? undefined,
      ownerPhotoUrl: ownerPhotoUrl ?? undefined,
    };

    onboarding.mutate(completeFormData);
  };

  const isPending =
    onboarding.isPending || imageUploader.isPending || isCreatingAccount;

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div
          key={currentStep}
          className="animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="mb-8">
            <h2 className="text-foreground text-xl font-semibold sm:text-2xl">
              Complete your profile
            </h2>
            <p className="text-muted-foreground mt-2">
              Add photos and details to make your profile stand out
            </p>
          </div>

          <div className="space-y-6">
            {onboarding.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{onboarding.error?.message}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ImageUploadFormField
                form={form}
                name="logoFile"
                label="Business logo (optional)"
                description="Upload your business logo. Shown on your store and in listings."
                disabled={isPending}
                inputRef={logoInputRef}
                className="col-span-1"
              />

              <ImageUploadFormField
                form={form}
                name="ownerPhotoFile"
                label="Owner or business image (optional)"
                description="A photo of you or an image that represents your business."
                disabled={isPending}
                inputRef={ownerPhotoInputRef}
                className="col-span-1"
              />
            </div>

            <InputFormField
              form={form}
              name="ownerName"
              label="Owner's name *"
              placeholder="e.g. Jane Smith"
              required
              autoFocus
            />

            <TextareaFormField
              form={form}
              name="ownerBio"
              label="Owner bio (optional)"
              placeholder="A short bio about you..."
              rows={3}
            />

            <TextareaFormField
              form={form}
              name="publicDescription"
              label="Public business description *"
              placeholder="A concise description of your business for visitors. Less wordy than the business interview—used to showcase your business."
              description="Used to showcase your business to viewers on your store and in listings."
              required
              rows={4}
              textareaClassName="min-h-[100px]"
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
