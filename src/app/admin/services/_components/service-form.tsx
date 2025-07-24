"use client";

// Key Change: Removed the <ScrollArea> component and its import.
// Replaced it with a standard <div className="h-[50svh] overflow-y-auto p-1">.

import { useForm } from "react-hook-form";
import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { ServiceWithShop } from "~/types/service";
import { useFileUpload } from "~/lib/file-upload/hooks/use-file-upload";
import { api } from "~/trpc/react";
import { useDefaultMutationActions } from "~/hooks/use-default-mutation-actions";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { LoadButton } from "~/components/common/load-button";
import { ImageFormField } from "~/components/inputs/image-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { TagFormField } from "~/components/inputs/tag-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";
import { Switch } from "~/components/ui/switch";
import { MultiSelectFormField, type OptionType } from "~/components/inputs/multi-select-form-field";

const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  priceInCents: z.coerce.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  tags: z.array(z.object({ id: z.string(), text: z.string() })),
  attributeTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  shopId: z.string().min(1, "Shop selection is required."),
  durationInMinutes: z.coerce.number().optional().nullable(),
  locationType: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
  image: z.any().optional(),
  categoryIds: z.array(z.string()).optional(),
});

type ServiceForm = z.infer<typeof serviceFormSchema>;

type Props = {
  initialData: ServiceWithShop | null;
  onSuccessCallback?: () => void;
};

export function ServiceForm({ initialData, onSuccessCallback }: Props) {
  const { uploadFile, isUploading } = useFileUpload({
    route: "services",
    api: "/api/upload-service",
    generateThumbnail: false,
  });

  const utils = api.useUtils();

  const { defaultSuccess, defaultError, defaultSettled } =
    useDefaultMutationActions({ entity: "service" });

  const { data: shops } = api.shop.getAll.useQuery();
  const { data: categories } = api.category.getAll.useQuery();

  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      priceInCents: initialData?.priceInCents ?? 0,
      currency: initialData?.currency ?? "USD",
      tags: initialData?.tags?.map((tag) => ({ id: tag, text: tag })) ?? [],
      attributeTags: initialData?.attributeTags ?? [],
      aiGeneratedTags: initialData?.aiGeneratedTags ?? [],
      shopId: initialData?.shopId ?? "",
      imageUrl: initialData?.imageUrl ?? "",
      durationInMinutes: initialData?.durationInMinutes ?? 0,
      locationType: initialData?.locationType ?? "",
      isPublic: initialData?.isPublic ?? false,
      categoryIds: initialData?.categories?.map((cat) => cat.id) ?? [],
    },
  });

  const createService = api.service.create.useMutation({
    onSuccess: ({ message }: { message: string }) => {
      defaultSuccess({ message });
      onSuccessCallback?.();
    },
    onError: defaultError,
    onSettled: defaultSettled,
  });

  const updateService = api.service.update.useMutation({
  onSuccess: async ({ message }: { message: string }) => {
    defaultSuccess({ message });
    await utils.service.getAll.invalidate();
    onSuccessCallback?.();
    },
    onError: defaultError,
    onSettled: defaultSettled,
});

  async function onSubmit(data: ServiceForm) {
    let imageUrl: string | null = initialData?.imageUrl ?? null;

    if (data.image) {
      imageUrl = await uploadFile(data.image as File);
      if (!imageUrl) {
        toastService.error("Error uploading image");
        return;
      }
    }

    const submissionData = {
      ...data,
      imageUrl,
      tags: data.tags.map((tag) => tag.text),
      categoryIds: data.categoryIds,
    };

    if (!initialData) {
      createService.mutate(submissionData);
    } else {
      updateService.mutate({
        ...submissionData,
        id: initialData.id,
      });
    }
  }

  const isLoading =
    createService.isPending || updateService.isPending || isUploading;

  const categoryOptions: OptionType[] =
    categories
      ?.filter(cat => cat.type === 'SERVICE')
      .map((cat) => ({
        value: cat.id,
        label: `${cat.parent ? `${cat.parent.name} / ` : ''}${cat.name}`,
      })) ?? [];

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        className="h-full space-y-8"
      >
        <div className="h-[50svh] overflow-y-auto p-1">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-6">
            <div className="col-span-2 flex flex-col gap-4">
              <InputFormField
                form={form}
                name="name"
                label="Service name"
                placeholder="e.g., Pottery Workshop"
              />
              <ImageFormField
                form={form}
                name="image"
                label="Service image"
                currentImageUrl={initialData?.imageUrl ?? ""}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Shop</label>
                <Select
                  onValueChange={(value) => form.setValue("shopId", value)}
                  defaultValue={initialData?.shopId ?? undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops?.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="col-span-4 flex flex-col gap-4">
              <FormField
                control={form.control}
                name="categoryIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categories</FormLabel>
                    <MultiSelectFormField
                      options={categoryOptions}
                      selected={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Select service categories..."
                    />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputFormField
                  form={form}
                  name="priceInCents"
                  label="Price (in cents)"
                  type="number"
                />
                <InputFormField
                  form={form}
                  name="durationInMinutes"
                  label="Duration (minutes)"
                  type="number"
                />
              </div>
              <InputFormField
                form={form}
                name="locationType"
                label="Location Type"
                placeholder="e.g., Online, In-Person"
              />
              <TextareaFormField
                form={form}
                name="description"
                label="Description"
              />
              <TagFormField
                form={form}
                name="tags"
                label="Tags"
              />
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Public Visibility</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex h-auto justify-end gap-2">
          <Button variant="outline" onClick={onSuccessCallback} type="button">
            Cancel
          </Button>
          <LoadButton
            isLoading={isLoading}
            loadingText={initialData ? "Updating..." : "Creating..."}
            type="submit"
          >
            {initialData ? "Update service" : "Create service"}
          </LoadButton>
        </div>
      </form>
    </Form>
  );
}