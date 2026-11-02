"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { ShopSectorFormValues } from "~/lib/validators/shop-sector";
import type { RouterOutputs } from "~/trpc/react";
import {
  SECTOR_COLOR_KEYS,
  SECTOR_PALETTE,
  sectorColor,
} from "~/lib/constants/shop-sectors";
import { cn } from "~/lib/utils";
import { shopSectorSchema } from "~/lib/validators/shop-sector";
import { api } from "~/trpc/react";
import { useDirtyForm } from "~/hooks/use-dirty-form";
import { useKeyboardEnter } from "~/hooks/use-keyboard-enter";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { InputFormField } from "~/components/inputs/input-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";
import { SectorSwatch } from "~/app/admin/_components/sector-swatch";

import { DeleteSectorDialog } from "./delete-sector-dialog";

type Props = {
  initialData: RouterOutputs["shopSector"]["get"];
  /** Every sector, to warn about a color another one already uses. */
  sectors: RouterOutputs["shopSector"]["getAll"];
};

export function SectorForm({ initialData, sectors }: Props) {
  const apiUtils = api.useUtils();
  const router = useRouter();

  const otherSectors = sectors.filter(
    (sector) => sector.id !== initialData?.id,
  );
  // A new sector starts on the first color nobody has yet.
  const unusedColorKey =
    SECTOR_COLOR_KEYS.find(
      (key) => !otherSectors.some((sector) => sector.colorKey === key),
    ) ?? SECTOR_COLOR_KEYS[0];

  const toFormValues = (
    data: RouterOutputs["shopSector"]["get"],
  ): ShopSectorFormValues => ({
    name: data?.name ?? "",
    shortName: data?.shortName ?? "",
    description: data?.description ?? "",
    // A retired key stays as it is, failing validation until one is picked.
    colorKey: (data?.colorKey ??
      unusedColorKey) as ShopSectorFormValues["colorKey"],
  });

  const form = useForm<ShopSectorFormValues>({
    resolver: zodResolver(shopSectorSchema),
    defaultValues: toFormValues(initialData),
  });

  /** Name conflicts belong next to the name field, not only in a toast. */
  const showNameConflict = (error: {
    message: string;
    data?: { code: string } | null;
  }) => {
    if (error.data?.code === "CONFLICT") {
      form.setError("name", { message: error.message });
    }
  };

  const createSector = api.shopSector.create.useMutation({
    onSuccess: ({ message, data }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      form.reset(form.getValues());
      void apiUtils.shopSector.invalidate();
      router.push(`/admin/sectors/${data.id}`);
    },
    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to create sector.", {
        id: context?.toastId,
      });
      showNameConflict(error);
    },
    onMutate: () => ({
      toastId: toast.loading("Creating sector, please wait..."),
    }),
  });

  const updateSector = api.shopSector.update.useMutation({
    onSuccess: ({ message }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      form.reset(form.getValues());
      void apiUtils.shopSector.invalidate();
      router.refresh();
    },
    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to update sector.", {
        id: context?.toastId,
      });
      showNameConflict(error);
    },
    onMutate: () => ({
      toastId: toast.loading("Updating sector, please wait..."),
    }),
  });

  const handleSubmit = async (data: ShopSectorFormValues) => {
    if (initialData) {
      updateSector.mutate({ id: initialData.id, ...data });
    } else {
      createSector.mutate(data);
    }
  };

  const isPending = createSector.isPending || updateSector.isPending;
  const isDirty = form.formState.isDirty;

  useDirtyForm(isDirty);
  useKeyboardEnter(form, handleSubmit);

  const selectedColorKey = form.watch("colorKey");
  const sharingColor = otherSectors.filter(
    (sector) => sector.colorKey === selectedColorKey,
  );

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)}
        className="min-h-screen"
      >
        <div className={cn("admin-form-toolbar", isDirty ? "dirty" : "")}>
          <div className="toolbar-info">
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/admin/sectors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="bg-border hidden h-6 w-px shrink-0 sm:block" />
            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <h1 className="text-base font-medium">
                {initialData
                  ? form.watch("name") || "Edit Sector"
                  : "New Sector"}
              </h1>

              <span
                className={`admin-status-badge ${
                  isDirty ? "isDirty" : "isPublished"
                }`}
              >
                {isDirty ? "Unsaved Changes" : "Saved"}
              </span>
            </div>
          </div>

          <div className="toolbar-actions">
            {initialData && (
              <DeleteSectorDialog
                sectorId={initialData.id}
                sectorName={initialData.name}
                shopCount={initialData._count.shops}
                onDeleted={() => {
                  form.reset(form.getValues());
                  router.push("/admin/sectors");
                }}
              />
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending || !isDirty}
              onClick={() => form.reset()}
              className="hidden md:inline-flex"
            >
              Reset
            </Button>

            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <>
                  <span className="saving-indicator" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Save changes</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="admin-container space-y-6">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-6">
            <div className="col-span-3 flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sector Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <InputFormField
                    form={form}
                    name="name"
                    label="Name"
                    placeholder="e.g., Food & Land"
                    description={
                      initialData
                        ? undefined
                        : "Also sets the sector's permanent slug, used in shared map links."
                    }
                  />

                  {initialData && (
                    <div className="space-y-2">
                      <Label htmlFor="sector-slug">Slug</Label>
                      <Input
                        id="sector-slug"
                        value={initialData.slug}
                        readOnly
                        disabled
                      />
                      <p className="text-muted-foreground text-sm">
                        The slug stays fixed, even if you rename the sector, so
                        shared map links keep working.
                      </p>
                    </div>
                  )}

                  <InputFormField
                    form={form}
                    name="shortName"
                    label="Short Name (Optional)"
                    placeholder="e.g., Food"
                    description="Shown on the map's filter chips. Defaults to the name."
                  />

                  <TextareaFormField
                    form={form}
                    name="description"
                    label="Description (Optional)"
                    placeholder="What kinds of shops belong in this sector?"
                    description="Helps artisans choose when they pick a sector for their shop."
                  />
                </CardContent>
              </Card>
            </div>

            <div className="col-span-3 flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Color</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="colorKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pin color</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid-cols-2 sm:grid-cols-4"
                          >
                            {SECTOR_PALETTE.map((color) => (
                              <Label
                                key={color.key}
                                htmlFor={`sector-color-${color.key}`}
                                className="has-data-[state=checked]:border-ring has-data-[state=checked]:bg-accent flex cursor-pointer items-center gap-2 rounded-md border p-2 font-normal"
                              >
                                <RadioGroupItem
                                  id={`sector-color-${color.key}`}
                                  value={color.key}
                                />
                                <SectorSwatch
                                  color={sectorColor(color.key)}
                                  className="size-3.5"
                                />
                                {color.name}
                              </Label>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Each color has tested light and dark map versions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {sharingColor.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {sharingColor.map((sector) => sector.name).join(", ")}{" "}
                        already {sharingColor.length === 1 ? "uses" : "use"}{" "}
                        this color. You can still save, but their pins will look
                        the same on the map.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
