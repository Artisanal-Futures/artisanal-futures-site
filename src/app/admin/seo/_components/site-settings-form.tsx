"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useUploadFile } from "@better-upload/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import type { RouterOutputs } from "~/trpc/react";
import {
  SEO_DESCRIPTION_TARGET,
  SEO_TITLE_TARGET,
  siteSettingsSchema,
} from "~/lib/validators/seo";
import { api } from "~/trpc/react";
import { useDirtyForm } from "~/hooks/use-dirty-form";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Form } from "~/components/ui/form";
import { ImageUploadFormField } from "~/components/inputs/image-upload-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { SwitchFormField } from "~/components/inputs/switch-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";
import { UrlListFormField } from "~/components/inputs/url-list-form-field";
import { characterCount } from "~/components/seo/search-result-preview";

const formSchema = siteSettingsSchema.extend({
  logoFile: z.instanceof(File).optional().nullable(),
  defaultOgImageFile: z.instanceof(File).optional().nullable(),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

type Settings = RouterOutputs["siteSettings"]["get"];

/** Site-wide images live in their own folder of the shop image bucket. */
const UPLOAD_FOLDER = "site";

function toFormValues(settings: Settings): FormInput {
  return {
    siteName: settings.siteName,
    alternateNames: settings.alternateNames,
    tagline: settings.tagline ?? "",
    defaultTitle: settings.defaultTitle ?? "",
    defaultDescription: settings.defaultDescription,
    defaultOgImage: settings.defaultOgImage ?? "",
    logo: settings.logo ?? "",
    contactEmail: settings.contactEmail ?? "",
    socialLinks: settings.socialLinks,
    twitterHandle: settings.twitterHandle ?? "",
    googleVerification: settings.googleVerification ?? "",
    bingVerification: settings.bingVerification ?? "",
    allowAiCrawlers: settings.allowAiCrawlers,
    llmsIntro: settings.llmsIntro ?? "",
    logoFile: null,
    defaultOgImageFile: null,
  };
}

export function SiteSettingsForm({ initialData }: { initialData: Settings }) {
  const router = useRouter();
  const apiUtils = api.useUtils();

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const ogImageInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: toFormValues(initialData),
  });

  const updateSettings = api.siteSettings.update.useMutation({
    onSuccess: ({ message }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      void apiUtils.siteSettings.invalidate();
      router.refresh();
    },
    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to save site settings.", {
        id: context?.toastId,
      });
    },
    onMutate: () => ({
      toastId: toast.loading("Saving site settings, please wait..."),
    }),
  });

  const imageUploader = useUploadFile({
    api: "/api/upload",
    route: "shopImage",
    onError: (error) => {
      toast.error(error.message ?? "Image upload failed.");
    },
  });

  const upload = async (file: File | null | undefined) => {
    if (!(file instanceof File)) return undefined;
    const response = await imageUploader.upload(file, {
      metadata: { businessSlug: UPLOAD_FOLDER },
    });
    return (
      (response.file.objectInfo.metadata?.pathname as string | undefined) ??
      undefined
    );
  };

  const handleSubmit = async ({
    logoFile,
    defaultOgImageFile,
    ...data
  }: FormOutput) => {
    let logo = data.logo;
    let defaultOgImage = data.defaultOgImage;
    try {
      logo = (await upload(logoFile)) ?? logo;
      defaultOgImage = (await upload(defaultOgImageFile)) ?? defaultOgImage;
    } catch {
      toast.error("Failed to upload image.");
      return;
    }

    const payload = { ...data, logo, defaultOgImage };
    updateSettings.mutate(payload, {
      onSuccess: () => {
        form.reset(
          toFormValues({
            ...payload,
            defaultDescription:
              payload.defaultDescription ?? initialData.defaultDescription,
          }),
        );
        if (logoInputRef.current) logoInputRef.current.value = "";
        if (ogImageInputRef.current) ogImageInputRef.current.value = "";
      },
    });
  };

  const isPending = updateSettings.isPending || imageUploader.isPending;
  const isDirty = form.formState.isDirty;
  const description = form.watch("defaultDescription");
  const defaultTitle = form.watch("defaultTitle");

  useDirtyForm(isDirty);

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)}
        className="space-y-6"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>
                The name search engines show for the site, and the organization
                profile behind it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <InputFormField
                form={form}
                name="siteName"
                label="Site name *"
                disabled={isPending}
                description="Used in every page title and as the organization name. Google takes a while to pick up changes."
              />
              <UrlListFormField
                form={form}
                name="alternateNames"
                type="text"
                label="Alternate names"
                addLabel="Add name"
                placeholder="e.g. ArtisanalFutures"
                disabled={isPending}
                description="Other names people search for, such as abbreviations."
              />
              <InputFormField
                form={form}
                name="tagline"
                label="Tagline"
                disabled={isPending}
              />
              <InputFormField
                form={form}
                name="contactEmail"
                label="Contact email"
                type="email"
                disabled={isPending}
                description="Listed as the organization's contact point. Defaults to the support address."
              />
              <ImageUploadFormField
                form={form}
                name="logoFile"
                label="Organization logo"
                description="A square logo for search results. Defaults to the site logo."
                disabled={isPending}
                existingPreviewUrl={initialData.logo ?? undefined}
                inputRef={logoInputRef}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Defaults</CardTitle>
              <CardDescription>
                Used by any page that doesn&apos;t set its own title,
                description or share image.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <InputFormField
                form={form}
                name="defaultTitle"
                label="Default title"
                placeholder={form.watch("siteName")}
                disabled={isPending}
                description={characterCount(defaultTitle, SEO_TITLE_TARGET)}
              />
              <TextareaFormField
                form={form}
                name="defaultDescription"
                label="Default description"
                rows={3}
                disabled={isPending}
                description={characterCount(
                  description,
                  SEO_DESCRIPTION_TARGET,
                )}
              />
              <ImageUploadFormField
                form={form}
                name="defaultOgImageFile"
                label="Default share image"
                description="1200×630. Defaults to the generated Artisanal Futures card."
                disabled={isPending}
                existingPreviewUrl={initialData.defaultOgImage ?? undefined}
                inputRef={ogImageInputRef}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social profiles</CardTitle>
              <CardDescription>
                The organization&apos;s profiles elsewhere. Search and AI
                engines use these to recognize Artisanal Futures as one entity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <UrlListFormField
                form={form}
                name="socialLinks"
                label="Profile links"
                placeholder="https://www.instagram.com/artisanalfutures"
                disabled={isPending}
              />
              <InputFormField
                form={form}
                name="twitterHandle"
                label="X / Twitter handle"
                placeholder="@artisanalfutures"
                disabled={isPending}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search engines &amp; AI</CardTitle>
              <CardDescription>
                Ownership verification and crawler access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <InputFormField
                form={form}
                name="googleVerification"
                label="Google Search Console code"
                placeholder="The content value of the google-site-verification tag"
                disabled={isPending}
              />
              <InputFormField
                form={form}
                name="bingVerification"
                label="Bing Webmaster code"
                placeholder="The content value of the msvalidate.01 tag"
                disabled={isPending}
              />
              <SwitchFormField
                form={form}
                name="allowAiCrawlers"
                label="Allow AI crawlers"
                description="GPTBot, ClaudeBot, PerplexityBot and others. Turning this off blocks them in robots.txt."
                disabled={isPending}
              />
              <TextareaFormField
                form={form}
                name="llmsIntro"
                label="llms.txt introduction"
                rows={5}
                placeholder="A short markdown summary of Artisanal Futures for AI assistants."
                disabled={isPending}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !isDirty}
            onClick={() => form.reset()}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
