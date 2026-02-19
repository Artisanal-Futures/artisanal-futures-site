"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { SiteType } from "@prisma/client";
import { Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { WebsiteCreateFormData } from "~/lib/validators/website-provision";
import { cn } from "~/lib/utils";
import { websiteCreateFormSchema } from "~/lib/validators/website-provision";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Form, FormField } from "~/components/ui/form";
import { InputFormField, SelectFormField } from "~/components/inputs";

type Props = {
  initialData?: {
    ownerId?: string;
    shopId: string;
    name?: string;
    email?: string;
  } | null;
  onSuccess?: () => void;
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

export function WebsiteProvisionForm({ initialData, onSuccess }: Props) {
  const utils = api.useUtils();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const form = useForm<WebsiteCreateFormData>({
    resolver: zodResolver(websiteCreateFormSchema),
    defaultValues: {
      ownerId: initialData?.ownerId ?? "",
      shopId: initialData?.shopId ?? "",
      websiteType: "ECOMMERCE",
      businessName: initialData?.name ?? "",
      contactEmail: initialData?.email ?? "",
      subdomain: initialData?.name ? slugify(initialData.name) : "",
      framework: "WORDPRESS",
    },
  });

  const createMutation = api.websiteProvision.create.useMutation({
    onSuccess: () => {
      toast.dismiss();
      toast.success("Website provision created successfully!");
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(`Error creating website provision: ${error.message}`);
    },
    onSettled: () => {
      void utils.shop.getAllWithWebsites.invalidate();
    },
    onMutate: () => {
      toast.loading("Creating website provision...");
    },
  });

  const createNextJsMutation = api.websiteProvision.createNextJs.useMutation({
    onSuccess: (data) => {
      toast.dismiss();
      toast.success("SimplePress provision created successfully! ");
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
    onSettled: () => {
      void utils.shop.getAllWithWebsites.invalidate();
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
        subdomain: data.subdomain,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <SelectFormField
          form={form}
          name="websiteType"
          label="Website Type"
          placeholder="Select website type"
          values={[{ value: SiteType.ECOMMERCE, label: "E-commerce" }]}
        />

        <InputFormField
          form={form}
          name="businessName"
          label="Business Name"
          placeholder="Enter business name"
          onChangeAdditional={(value: string) => {
            form.setValue("subdomain", slugify(value));
          }}
        />

        {form.watch("framework") === "NEXTJS" && (
          <InputFormField
            form={form}
            name="subdomain"
            onChangeAdditional={(value) => {
              form.setValue("subdomain", slugify(value));
            }}
            label="Subdomain"
            placeholder="Enter business name"
          />
        )}

        <InputFormField
          form={form}
          name="contactEmail"
          label="Contact Email"
          placeholder="contact@business.com"
          type="email"
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
