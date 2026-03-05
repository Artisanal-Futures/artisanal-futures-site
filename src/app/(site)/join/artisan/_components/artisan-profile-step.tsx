"use client";

import { useState } from "react";
import { useUploadFile } from "@better-upload/client";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { SignupFormData } from "./wizard-client";
import { slugify } from "~/lib/utils";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { ImagePicker } from "~/components/inputs/image-picker";

type ArtisanProfileStepProps = {
  formData: Partial<SignupFormData>;
  onNext: (data: Partial<SignupFormData>) => void;
  onBack?: () => void;
};

export function ArtisanProfileStep({
  formData,
  onBack,
}: ArtisanProfileStepProps) {
  const [ownerName, setOwnerName] = useState(formData.ownerName ?? "");
  const [ownerBio, setOwnerBio] = useState(formData.ownerBio ?? "");
  const [publicDescription, setPublicDescription] = useState(
    formData.publicDescription ?? "",
  );
  const [logoFile, setLogoFile] = useState<File | null>(
    formData.logoFile ?? null,
  );
  const [ownerPhotoFile, setOwnerPhotoFile] = useState<File | null>(
    formData.ownerPhotoFile ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      window.location.href = data.redirectUrl ?? "/";
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
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.email || !formData.password || !formData.name) {
        setError("Please fill in all account details");
        return;
      }

      await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: "ARTISAN",
      });

      if (!ownerName.trim()) {
        setError("Please enter the owner's name");
        return;
      }
      if (!publicDescription.trim()) {
        setError("Please add a short public description of your business");
        return;
      }

      const businessSlug = slugify(formData.businessName ?? "");

      let logoPhotoUrl: string | undefined;
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
          setError("Failed to upload logo.");
          setIsSubmitting(false);
          return;
        }
      }

      let ownerPhotoUrl: string | undefined;
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
          setError("Failed to upload owner photo.");
          setIsSubmitting(false);
          return;
        }
      }

      const completeFormData = {
        ...formData,
        ownerName: ownerName.trim(),
        ownerBio: ownerBio.trim() || undefined,
        publicDescription: publicDescription.trim(),
        logoFile: undefined,
        ownerPhotoFile: undefined,
        logoPhotoUrl,
        ownerPhotoUrl,
      } as SignupFormData;

      onboarding.mutate(completeFormData);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Artisan profile</CardTitle>
        <CardDescription>
          Add a face to your store. This is how visitors will see you and your
          business.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ImagePicker
            value={logoFile}
            onChange={setLogoFile}
            label="Business logo (optional)"
            description="Upload your business logo. Shown on your store and in listings."
          />

          <ImagePicker
            value={ownerPhotoFile}
            onChange={setOwnerPhotoFile}
            label="Owner or business image (optional)"
            description="A photo of you or an image that represents your business."
          />

          <div>
            <Label
              htmlFor="ownerName"
              className="mb-2 block text-sm font-medium"
            >
              Owner&apos;s name *
            </Label>
            <Input
              id="ownerName"
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Jane Smith"
              required
              autoFocus
            />
          </div>

          <div>
            <Label
              htmlFor="ownerBio"
              className="mb-2 block text-sm font-medium"
            >
              Owner bio (optional)
            </Label>
            <Textarea
              id="ownerBio"
              value={ownerBio}
              onChange={(e) => setOwnerBio(e.target.value)}
              placeholder="A short bio about you..."
              rows={3}
            />
          </div>

          <div>
            <Label
              htmlFor="publicDescription"
              className="mb-2 block text-sm font-medium"
            >
              Public business description *
            </Label>
            <Textarea
              id="publicDescription"
              value={publicDescription}
              onChange={(e) => setPublicDescription(e.target.value)}
              placeholder="A concise description of your business for visitors. Less wordy than the business interview—used to showcase your business."
              required
              className="min-h-[100px]"
              rows={4}
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Used to showcase your business to viewers on your store and in
              listings.
            </p>
          </div>

          <div className="flex gap-3">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || imageUploader.isPending}
            >
              {isSubmitting || imageUploader.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {imageUploader.isPending ? "Uploading..." : "Continue"}
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
