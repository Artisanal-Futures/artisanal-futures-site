"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUploadFile } from "@better-upload/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { createId } from "@paralleldrive/cuid2";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { OptionType } from "~/components/inputs/multi-select-form-field";
import type { ProductFormData } from "~/lib/validators/products";
import type { RouterOutputs } from "~/trpc/react";
import { cn, slugify } from "~/lib/utils";
import { productFormSchema } from "~/lib/validators/products";
import { api } from "~/trpc/react";
import { useDirtyForm } from "~/hooks/use-dirty-form";
import { useKeyboardEnter } from "~/hooks/use-keyboard-enter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { FancySwitchFormField } from "~/components/inputs/fancy-switch-form-field";
import { ImageUploadFormField } from "~/components/inputs/image-upload-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { MultiSelectFormField } from "~/components/inputs/multi-select-form-field";
import { SelectFormField } from "~/components/inputs/select-form-field";
import { TagFormField } from "~/components/inputs/tag-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";

type Props = {
  initialData: RouterOutputs["product"]["get"];
  shops: RouterOutputs["shop"]["getAll"];
  categories: RouterOutputs["category"]["getAll"];
  userRole: string;
};

export function ProductForm({
  initialData,
  shops,
  categories,
  userRole,
}: Props) {
  const imageUploader = useUploadFile({
    api: "/api/upload",
    route: "shopImage",
    onError: (error) => {
      toast.error(error.message ?? "Image upload failed.");
    },
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();
  const apiUtils = api.useUtils();

  const defaultValues: ProductFormData = {
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    priceInCents: initialData?.priceInCents ?? 0,
    currency: (initialData?.currency as "USD" | "CAD" | "EUR" | "GBP") ?? "USD",
    tags: initialData?.tags?.map((tag) => ({ id: tag, text: tag })) ?? [],
    productUrl: initialData?.productUrl ?? "",
    attributeTags: initialData?.attributeTags ?? [],
    materialTags: initialData?.materialTags ?? [],
    environmentalTags: initialData?.environmentalTags ?? [],
    aiGeneratedTags: initialData?.aiGeneratedTags ?? [],
    shopId: initialData?.shopId ?? "",
    shopProductId: initialData?.shopProductId ?? `af${createId()}`,
    scrapeMethod: initialData?.scrapeMethod ?? "MANUAL",
    imageUrl: initialData?.imageUrl ?? "",
    categoryIds: initialData?.categories?.map((cat) => cat.id) ?? [],
    isFeatured: initialData?.isFeatured ?? false,
    isPublic: initialData?.isPublic ?? false,

    imageFile: null,
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormData>,
    defaultValues,
  });

  const createProduct = api.product.create.useMutation({
    onSuccess: ({ message, data }) => {
      toast.dismiss();
      toast.success(message);
      handleReset(data);
      void apiUtils.product.invalidate();
      router.push(`/admin/products/${data.id}`);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to create product.");
    },
    onMutate: () => {
      toast.loading("Creating product, please wait...");
    },
  });

  const updateProduct = api.product.update.useMutation({
    onSuccess: ({ message, data }) => {
      toast.dismiss();
      toast.success(message);
      handleReset(data);
      void apiUtils.product.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to update product.");
    },
    onMutate: () => {
      toast.loading("Updating product, please wait...");
    },
  });

  const deleteProduct = api.product.delete.useMutation({
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message);
      void apiUtils.product.invalidate();
      router.push("/admin/products");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete product.");
    },
    onMutate: () => {
      toast.loading("Deleting product, please wait...");
    },
  });

  const handleSubmit = async (data: ProductFormData) => {
    const businessName =
      shops?.find((shop) => shop.id === data.shopId)?.name ?? "";
    const businessSlug = slugify(businessName);

    let imageUrl: string | undefined = data.imageUrl ?? undefined;
    const imageFile = data.imageFile;
    if (imageFile instanceof File) {
      try {
        const response = await imageUploader.upload(imageFile, {
          metadata: { businessSlug },
        });
        const fileLocation =
          (response.file.objectInfo.metadata?.pathname as string | undefined) ??
          "";
        if (fileLocation) imageUrl = fileLocation;
      } catch {
        toast.error("Failed to upload product image.");
        return;
      }
    }

    if (!initialData) {
      createProduct.mutate({ ...data, imageUrl });
    } else {
      updateProduct.mutate({
        ...data,
        id: initialData.id,
        imageUrl,
      });
    }
  };

  const handleReset = (data?: Omit<ProductFormData, "currency"> & { currency?: string | null }) => {
    if (data)
      form.reset({
        ...(data as ProductFormData),
        currency: (data.currency as "USD" | "CAD" | "EUR" | "GBP") ?? "USD",
        imageFile: null,
      });
    else form.reset(defaultValues);

    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
  };

  const categoryOptions: OptionType[] =
    categories
      ?.filter((cat) => cat.type === "PRODUCT")
      .map((cat) => ({
        value: cat.id,
        label: `${cat.parent ? `${cat.parent.name} / ` : ""}${cat.name}`,
      })) ?? [];

  const isPending =
    createProduct.isPending ||
    updateProduct.isPending ||
    imageUploader.isPending;

  const isDirty = form.formState.isDirty;

  useDirtyForm(isDirty);
  useKeyboardEnter(form, handleSubmit);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)}
          ref={formRef}
          className="min-h-screen"
        >
          <div className={cn("admin-form-toolbar", isDirty ? "dirty" : "")}>
            <div className="toolbar-info">
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href="/admin/products">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="bg-border hidden h-6 w-px shrink-0 sm:block" />
              <div className="hidden min-w-0 items-center gap-2 sm:flex">
                <h1 className="text-base font-medium">
                  {initialData
                    ? form.watch("name") || "Edit Product"
                    : "New Product"}
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setShowDeleteDialog(true)}
                  aria-label="Delete product"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
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
              <div className="col-span-2 flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <InputFormField
                      form={form}
                      name="name"
                      label="Product name *"
                      placeholder="e.g. My product"
                    />
                    <ImageUploadFormField
                      form={form}
                      name="imageFile"
                      label="Product image"
                      description="Upload your product image here!"
                      disabled={isPending}
                      existingPreviewUrl={initialData?.imageUrl ?? undefined}
                      inputRef={imageFileInputRef}
                    />

                    <SelectFormField
                      form={form}
                      name="shopId"
                      label="Select Shop *"
                      values={shops?.map((shop) => ({
                        label: shop.name,
                        value: shop.id,
                      }))}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-4 flex flex-col gap-4">
                <Card>
                  <CardContent>
                    <FancySwitchFormField
                      form={form}
                      name="isPublic"
                      label="Visible to public"
                      description="When off, this is hidden from the public storefront."
                    />
                  </CardContent>
                </Card>

                {userRole === "ADMIN" && (
                  <Card>
                    <CardContent>
                      <FancySwitchFormField
                        form={form}
                        name="isFeatured"
                        label="Featured"
                        description="(ADMIN) Make this be a featured product on the products page."
                      />
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Product Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="priceInCents"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>Price (USD)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="19.99"
                                value={
                                  field.value != null && field.value !== 0
                                    ? (field.value / 100).toFixed(2)
                                    : ""
                                }
                                onChange={(e) => {
                                  const raw = parseFloat(e.target.value);
                                  field.onChange(
                                    isNaN(raw)
                                      ? null
                                      : Math.round(raw * 100),
                                  );
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the price in dollars.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <SelectFormField
                        form={form}
                        name="currency"
                        label="Currency"
                        className="col-span-1"
                        values={[
                          { label: "USD", value: "USD" },
                          { label: "CAD", value: "CAD" },
                          { label: "EUR", value: "EUR" },
                          { label: "GBP", value: "GBP" },
                        ]}
                      />
                    </div>
                    <TextareaFormField
                      form={form}
                      name="description"
                      label="Description *"
                      placeholder="e.g. This is a description of my product."
                    />
                    <TagFormField
                      form={form}
                      name="tags"
                      label="Tags"
                      placeholder="e.g. Tag1, Tag2, Tag3 (separate with commas)"
                      description="Tags are used to categorize your product. Separate with commas."
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </Form>
      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{form.watch("name")}&quot;?
              This action cannot be undone. This will permanently delete the
              product and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteProduct.mutate(initialData?.id ?? "");
              }}
              disabled={deleteProduct.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
