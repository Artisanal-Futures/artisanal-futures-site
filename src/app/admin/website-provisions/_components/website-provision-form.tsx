"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { Skeleton } from "~/components/ui/skeleton";
import { InputFormField } from "~/components/inputs/input-form-field";
import { SelectFormField } from "~/components/inputs/select-form-field";

// NOTE: WordPress provisioning was intentionally removed from this form.
// The router still supports it (see `websiteProvisionRouter.create`), but the
// product decision is to only offer the SimplePress headless flow here for
// now. WordPress may return as an option later.

type Props = {
  initialData?: {
    ownerId?: string;
    shopId: string;
    name?: string;
    email?: string;
  } | null;
  onSuccessCallback?: () => void;
};

const formSchema = z.object({
  shopId: z.string().min(1, "Select a shop"),
  contactEmail: z.string().email("Invalid email address"),
});

type FormValues = z.infer<typeof formSchema>;

export function WebsiteProvisionForm({ initialData, onSuccessCallback }: Props) {
  const router = useRouter();
  const utils = api.useUtils();

  const preselectedShopId = initialData?.shopId ?? "";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shopId: preselectedShopId,
      contactEmail: initialData?.email ?? "",
    },
  });

  const shopId = form.watch("shopId");

  // Only needed when this form is opened without a pre-selected shop (the
  // top-level "Create New Website" button) — the row-level entry point
  // already supplies `initialData.shopId`.
  const { data: shops, isLoading: isLoadingShops } =
    api.websiteProvision.listMyShops.useQuery(undefined, {
      enabled: !preselectedShopId,
    });

  const { data: shopData, isLoading: isLoadingShopData } =
    api.websiteProvision.getShopForProvision.useQuery(
      { shopId },
      { enabled: !!shopId },
    );

  // Prefill the contact email from the shop's onboarding data whenever the
  // selected shop changes, but never stomp on an admin's manual edit.
  useEffect(() => {
    if (!shopData) return;
    if (form.formState.dirtyFields.contactEmail) return;
    form.setValue("contactEmail", shopData.onboardingData.contactEmail ?? "");
  }, [shopData, form]);

  const requestMySite = api.websiteProvision.requestMySite.useMutation({
    onSuccess: (_data, variables) => {
      toast.dismiss();
      toast.success(
        `Site built — claim email sent to ${variables?.contactEmailOverride ?? "the shop's contact email"}`,
      );
      onSuccessCallback?.();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message);
    },
    onMutate: () => {
      toast.loading("Building the site on SimplePress...");
    },
    onSettled: () => {
      void utils.shop.getAllWithWebsites.invalidate();
      void utils.websiteProvision.invalidate();
      router.refresh();
    },
  });

  const onSubmit = (values: FormValues) => {
    requestMySite.mutate({
      shopId: values.shopId,
      contactEmailOverride: values.contactEmail,
    });
  };

  const businessName =
    shopData?.onboardingData.businessName ?? initialData?.name ?? "";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!preselectedShopId && (
          <SelectFormField
            form={form}
            name="shopId"
            label="Shop"
            description="Which shop is this site for?"
            placeholder={isLoadingShops ? "Loading shops..." : "Select a shop"}
            disabled={isLoadingShops}
            values={(shops ?? []).map((shop) => ({
              value: shop.id,
              label: shop.websiteProvision
                ? `${shop.name} (${shop.websiteProvision.status})`
                : shop.name,
            }))}
          />
        )}

        {shopId && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Business</p>
            {isLoadingShopData ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  {businessName || "—"}
                </span>
                {shopData?.hasProvision && (
                  <Badge variant="secondary">
                    Existing provision: {shopData.shop.websiteProvision?.status}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        <InputFormField
          form={form}
          name="contactEmail"
          label="Contact email"
          description="Claim link and SimplePress invite go to this address. Change it if the shop was created by an admin — the owner, not the admin, must receive it."
          placeholder="e.g. hello@example.com"
          type="email"
          required
        />

        <div className="flex justify-end space-x-4">
          <Button type="submit" disabled={requestMySite.isPending || !shopId}>
            {requestMySite.isPending
              ? "Building..."
              : shopData?.hasProvision
                ? "Rebuild / Resend Claim Email"
                : "Build Site"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
