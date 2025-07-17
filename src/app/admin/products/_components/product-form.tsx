"use client";

import { useForm } from "react-hook-form";
import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import type { ProductWithRelations } from "~/types/product";
import { useFileUpload } from "~/lib/file-upload/hooks/use-file-upload";
import { api } from "~/trpc/react";
import { useDefaultMutationActions } from "~/hooks/use-default-mutation-actions";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { ScrollArea } from "~/components/ui/scroll-area";
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
import { MultiSelectFormField, type OptionType } from "~/components/inputs/multi-select-form-field";

// Updated schema to include categoryIds
const productFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  priceInCents: z.coerce.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  productUrl: z.string().optional().nullable(),
  tags: z.array(z.object({ id: z.string(), text: z.string() })),
  attributeTags: z.array(z.string()),
  materialTags: z.array(z.string()),
  environmentalTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  shopId: z.string().min(1, "Shop selection is required."),
  shopProductId: z.string().optional().nullable(),
  scrapeMethod: z.enum(["MANUAL", "WORDPRESS", "SHOPIFY", "SQUARESPACE"]).default("MANUAL"),
  image: z.any().optional(),
  categoryIds: z.array(z.string()).optional(),
});

type ProductForm = z.infer<typeof productFormSchema>;

type Props = {
  initialData: ProductWithRelations | null;
  onSuccessCallback?: () => void;
};

export function ProjectForm({ initialData, onSuccessCallback }: Props) {
  const { uploadFile, isUploading } = useFileUpload({
    route: "products",
    api: "/api/upload-product",
    generateThumbnail: false,
  });

  const { defaultSuccess, defaultError, defaultSettled } =
    useDefaultMutationActions({ entity: "product" });

  const { data: shops } = api.shop.getAll.useQuery();
  const { data: categories } = api.category.getAll.useQuery();

  const form = useForm<ProductForm>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      priceInCents: initialData?.priceInCents ?? 0,
      currency: initialData?.currency ?? "USD",
      tags: initialData?.tags?.map((tag) => ({ id: tag, text: tag })) ?? [],
      productUrl: initialData?.productUrl ?? "",
      attributeTags: initialData?.attributeTags ?? [],
      materialTags: initialData?.materialTags ?? [],
      environmentalTags: initialData?.environmentalTags ?? [],
      aiGeneratedTags: initialData?.aiGeneratedTags ?? [],
      shopId: initialData?.shopId ?? "",
      shopProductId: initialData?.shopProductId ?? "",
      scrapeMethod: initialData?.scrapeMethod ?? "MANUAL",
      imageUrl: initialData?.imageUrl ?? "",
      categoryIds: initialData?.categories?.map((cat) => cat.id) ?? [],
    },
  });

  const createProduct = api.product.create.useMutation({
    onSuccess: ({ message }: { message: string }) => {
      defaultSuccess({ message });
      onSuccessCallback?.();
    },
    onError: defaultError,
    onSettled: defaultSettled,
  });

  const updateProduct = api.product.update.useMutation({
    onSuccess: ({ message }: { message: string }) => {
      defaultSuccess({ message });
      onSuccessCallback?.();
    },
    onError: defaultError,
    onSettled: defaultSettled,
  });

  async function onSubmit(data: ProductForm) {
    let imageUrl: string | null = initialData?.imageUrl ?? null;

    if (!data.image && !initialData?.imageUrl) {
      toastService.error("Please upload an image");
      return;
    }

    if (data.image) {
      imageUrl = await uploadFile(data.image as File);
      if (!imageUrl) {
        toastService.error("Error uploading image");
        return;
      }
    }

    const submissionData = {
      ...data,
      tags: data.tags.map((tag) => tag.text),
      categoryIds: data.categoryIds,
    };

    if (!initialData) {
      createProduct.mutate({ ...submissionData, imageUrl: imageUrl! });
    } else {
      updateProduct.mutate({
        ...submissionData,
        id: initialData.id,
        imageUrl: imageUrl ?? undefined,
      });
    }
  }

  const categoryOptions: OptionType[] =
    categories?.map((cat) => ({
      value: cat.id,
      label: `${cat.parent ? `${cat.parent.name} / ` : ''}${cat.name}`,
    })) ?? [];

  const isLoading = createProduct.isPending || updateProduct.isPending || isUploading;

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        className="h-full space-y-8"
      >
        <ScrollArea className="h-[50svh]" type="always">
          <div className="flex flex-col gap-4 p-1 md:grid md:grid-cols-6">
            <div className="col-span-2 flex flex-col gap-4">
              <InputFormField
                form={form}
                name="name"
                label="Product name"
                placeholder="e.g My product"
              />
              <ImageFormField
                form={form}
                name="image"
                label="Product image"
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
                      placeholder="Select categories..."
                    />
                  </FormItem>
                )}
              />
              <InputFormField
                form={form}
                name="productUrl"
                label="Product URL"
              />
              <div className="grid grid-cols-2 gap-4">
                <InputFormField
                  form={form}
                  name="priceInCents"
                  label="Price (in cents)"
                  type="number"
                />
                <InputFormField form={form} name="currency" label="Currency" />
              </div>
              <TextareaFormField
                form={form}
                name="description"
                label="Description"
              />
              <TagFormField
                form={form}
                defaultValue={initialData?.tags.map((tag) => ({ id: tag, text: tag })) ?? []}
                name="tags"
                label="Tags"
              />
            </div>
          </div>
        </ScrollArea>
        <div className="flex h-auto justify-end gap-2">
          <Button variant="outline" onClick={onSuccessCallback} type="button">
            Cancel
          </Button>
          <LoadButton
            isLoading={isLoading}
            loadingText={initialData ? "Updating..." : "Creating..."}
            type="submit"
          >
            {initialData ? "Update product" : "Create product"}
          </LoadButton>
        </div>
      </form>
    </Form>
  );
}
