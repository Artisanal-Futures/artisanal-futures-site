"use client";

import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { zodResolver } from "@hookform/resolvers/zod";

import type { ShopPrivateContactFormInput } from "~/lib/validators/shop-private-contact";
import { cn } from "~/lib/utils";
import { shopPrivateContactFormSchema } from "~/lib/validators/shop-private-contact";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { InputFormField } from "~/components/inputs/input-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";

export type PrivateContactValues = {
  name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

type Props = {
  shopId: string;
  initial: PrivateContactValues | null;
  onSaved?: () => void;
  onCancel?: () => void;
  className?: string;
  /** Hide the "admin-only" notice when the surrounding UI already says so. */
  hideNotice?: boolean;
};

export function PrivateContactForm({
  shopId,
  initial,
  onSaved,
  onCancel,
  className,
  hideNotice = false,
}: Props) {
  const router = useRouter();
  const apiUtils = api.useUtils();

  const form = useForm<ShopPrivateContactFormInput>({
    resolver: zodResolver(
      shopPrivateContactFormSchema,
    ) as Resolver<ShopPrivateContactFormInput>,
    defaultValues: {
      name: initial?.name ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      notes: initial?.notes ?? "",
    },
  });

  const upsert = api.shop.upsertPrivateContact.useMutation({
    onSuccess: (result, variables) => {
      toast.success(result ? "Private contact saved" : "Private contact cleared");
      form.reset({
        name: variables.name ?? "",
        email: variables.email ?? "",
        phone: variables.phone ?? "",
        notes: variables.notes ?? "",
      });
      void apiUtils.shop.getPrivateContact.invalidate(shopId);
      router.refresh();
      onSaved?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save private contact.");
    },
  });

  const onSubmit = (values: ShopPrivateContactFormInput) => {
    upsert.mutate({ shopId, ...values });
  };

  const { isDirty } = form.formState;

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          void form.handleSubmit(onSubmit)(e);
        }}
        className={cn("grid gap-3", className)}
      >
        {hideNotice ? null : (
          <p className="text-muted-foreground text-xs">
            Admin-only. Never shown publicly or to the shop owner.
          </p>
        )}

        <InputFormField
          form={form}
          name="name"
          label="Contact name"
          placeholder="Who is the artisan?"
          autoComplete="off"
        />
        <InputFormField
          form={form}
          name="email"
          label="Private email"
          type="email"
          placeholder="artisan@example.com"
          autoComplete="off"
        />
        <InputFormField
          form={form}
          name="phone"
          label="Private phone"
          type="tel"
          placeholder="(555) 123-4567"
          autoComplete="off"
        />
        <TextareaFormField
          form={form}
          name="notes"
          label="Notes"
          rows={3}
          placeholder="Preferred contact times, who to ask for, context…"
        />

        <div className="flex items-center justify-end gap-2 pt-1">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={upsert.isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={upsert.isPending || !isDirty}
          >
            {upsert.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save private contact
          </Button>
        </div>
      </form>
    </Form>
  );
}
