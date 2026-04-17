"use client";

import type { Shop, WebsiteProvision } from "generated/prisma";
import { useRouter } from "next/navigation";
import { SiteType } from "generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { WebsiteCreateFormData } from "~/lib/validators/website-provision";
import { cn } from "~/lib/utils";
import { websiteCreateFormSchema } from "~/lib/validators/website-provision";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Form, FormField } from "~/components/ui/form";
import { InputFormField } from "~/components/inputs/input-form-field";
import { SelectFormField } from "~/components/inputs/select-form-field";

type ShopWithWebsite = Shop & {
  websiteProvision: WebsiteProvision | null;
};

type Props = {
  initialData?: {
    ownerId?: string;
    shopId: string;
    name?: string;
    email?: string;
  } | null;
  onSuccess?: () => void;
  shops?: ShopWithWebsite[];
};

const TEMPLATES = [
  {
    id: "WORDPRESS",
    name: "WordPress",
    description: "A templated WordPress site for e-commerce / blog purposes.",
  },
  {
    id: "NEXTJS",
    name: "SimplePress",
    description:
      "A minimalistic e-commerce platform to get you started quickly.",
  },
];

export function WebsiteProvisionForm({ initialData, onSuccess, shops }: Props) {
  console.log(initialData);
  const utils = api.useUtils();
  const router = useRouter();

  const form = useForm<WebsiteCreateFormData>({
    resolver: zodResolver(websiteCreateFormSchema),
    defaultValues: {
      ownerId: initialData?.ownerId ?? "",
      shopId: initialData?.shopId ?? "",
      websiteType: "ECOMMERCE",
      framework: "WORDPRESS",
      businessName: initialData?.name ?? "",
      contactEmail: initialData?.email ?? "",
      subdomain: "",
    },
  });

  const createMutation = api.websiteProvision.createWordPress.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Website provision created successfully!");
      void utils.shop.invalidate();
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(`Error creating website provision: ${error.message}`);
    },
    onMutate: () => {
      toast.loading("Creating website provision...");
    },
  });

  const createNextJsMutation = api.websiteProvision.createNextJs.useMutation({
    onSuccess: (data) => {
      toast.dismiss();
      toast.success("SimplePress provision created successfully! ");
      void utils.shop.invalidate();
      if (data?.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      }
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(`Error creating SimplePress website: ${error.message}`);
    },
    onMutate: () => {
      toast.loading("Creating SimplePress website...");
    },
  });

  const onSubmit = (data: WebsiteCreateFormData) => {
    if (data.framework === "NEXTJS") {
      createNextJsMutation.mutate({
        shopId: data.shopId,
        userId: data.ownerId,
        siteType: data.websiteType,
        framework: data.framework,
        businessName: data.businessName,
        contactEmail: data.contactEmail,
      });
    } else {
      createMutation.mutate({
        shopId: data.shopId,
        userId: data.ownerId,
        siteType: data.websiteType,
        framework: data.framework,
        businessName: data.businessName,
        contactEmail: data.contactEmail,
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        onChange={() => console.log(form.formState.errors)}
      >
        <FormField
          control={form.control}
          name="framework"
          render={({ field }) => (
            <div className="grid gap-4 md:grid-cols-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => field.onChange(template.id)}
                  className={cn(
                    "relative rounded-lg border-2 p-4 text-left transition-all hover:border-blue-300",
                    form.watch("framework") === template.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white",
                  )}
                >
                  {/* Selected Indicator */}
                  {form.watch("framework") === template.id && (
                    <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Template Preview */}
                  <div className="mb-3 flex aspect-video items-center justify-center rounded bg-linear-to-br from-gray-100 to-gray-200">
                    <span className="text-xs font-medium text-gray-500">
                      {template.name}
                    </span>
                  </div>

                  {/* Template Info */}
                  <h3 className="mb-1 text-sm font-semibold">
                    {template.name}
                  </h3>
                  <p className="line-clamp-2 text-xs text-gray-600">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        />

        {!!shops && shops?.length > 0 && (
          <SelectFormField
            form={form}
            name="shopId"
            label="What shop does this provision belong to?"
            values={
              shops?.map((shop) => ({
                label: shop.name,
                value: shop.id,
              })) ?? []
            }
            onValueChange={(value) => {
              const ownerId = shops?.find((shop) => shop.id === value)?.ownerId;
              form.setValue("ownerId", ownerId ?? "");
            }}
            defaultValue={initialData?.shopId ?? ""}
          />
        )}

        <InputFormField
          form={form}
          name="businessName"
          label="What is the name of your business?"
          description="This will be used as the name of the business and will be displayed on the website."
          placeholder="e.g. My Awesome Store"
          required
        />

        <InputFormField
          form={form}
          name="contactEmail"
          label="What email will be used to sign in to the website?"
          description="This is the email that will be used to sign in to the website. "
          placeholder="e.g. hello@example.com"
          type="email"
          required
        />
        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Website"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
