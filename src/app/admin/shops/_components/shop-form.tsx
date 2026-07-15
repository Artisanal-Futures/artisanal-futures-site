"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUploadFile } from "@better-upload/client";
import { zodResolver } from "@hookform/resolvers/zod";

import type { ShopFormData } from "~/lib/validators/shop";
import type { RouterOutputs } from "~/trpc/react";
import { handleImageUrl } from "~/lib/handle-image-url";
import { cn, slugify } from "~/lib/utils";
import { shopFormSchema } from "~/lib/validators/shop";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Form, FormLabel } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { FancySwitchFormField } from "~/components/inputs/fancy-switch-form-field";
import { ImageUploadFormField } from "~/components/inputs/image-upload-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { SelectFormField } from "~/components/inputs/select-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";

type Props = {
  initialData: RouterOutputs["shop"]["get"];
  userRole: string;
  potentialShopOwners: RouterOutputs["shop"]["getShopOwners"];
};

const STORE_ATTRIBUTES = [
  "African American Culture",
  "African Culture",
  "African American Civil Rights",
  "Black Owned",
  "Woman Owned",
  "Worker Owned",
  "Community Education",
  "Food Sovereignty",
] as const;

export function ShopForm({
  initialData,
  userRole,
  potentialShopOwners,
}: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const router = useRouter();
  const apiUtils = api.useUtils();

  const formRef = useRef<HTMLFormElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const ownerFileInputRef = useRef<HTMLInputElement | null>(null);

  const initialFormValues: ShopFormData = {
    name: initialData?.name ?? "",
    ownerName: initialData?.ownerName ?? "",
    bio: initialData?.bio ?? "",
    description: initialData?.description ?? "",
    website: initialData?.website ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    address: initialData?.address?.address ?? "",
    city: initialData?.address?.city ?? "",
    state: initialData?.address?.state ?? "",
    zip: initialData?.address?.zip ?? "",
    country: initialData?.address?.country ?? "US",
    attributeTags: initialData?.attributeTags ?? [],
    ownerId: initialData?.ownerId ?? "",
    isPublic: initialData?.isPublic ?? true,

    ownerPhotoUrl: initialData?.ownerPhoto
      ? handleImageUrl(initialData.ownerPhoto)
      : undefined,
    logoPhotoUrl: initialData?.logoPhoto
      ? handleImageUrl(initialData.logoPhoto)
      : undefined,

    ownerPhotoFile: null,
    logoPhotoFile: null,
  };

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopFormSchema) as Resolver<ShopFormData>,
    defaultValues: initialFormValues,
  });

  const updateShop = api.shop.update.useMutation({
    onSuccess: ({ data, message }) => {
      toast.dismiss();
      toast.success(message);
      handleReset(data);
      void apiUtils.shop.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to update shop.");
    },
    onMutate: () => {
      toast.loading("Updating shop, please wait...");
    },
  });

  const createShop = api.shop.create.useMutation({
    onSuccess: ({ message, data }) => {
      toast.dismiss();
      toast.success(message);
      void apiUtils.shop.invalidate();
      router.push(`/admin/shops/${data.id}`);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to create shop.");
    },
    onMutate: () => {
      toast.loading("Creating shop, please wait...");
    },
  });

  const deleteShop = api.shop.delete.useMutation({
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message);
      void apiUtils.shop.invalidate();
      router.push("/admin/shops");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete shop.");
    },
    onMutate: () => {
      toast.loading("Deleting shop, please wait...");
    },
  });

  const imageUploader = useUploadFile({
    api: "/api/upload",
    route: "shopImage",
    onError: (error) => {
      toast.error(error.message ?? "Image upload failed.");
    },
  });

  const handleSubmit = async (data: ShopFormData) => {
    const businessSlug = slugify(data.name);

    let logoPhotoUrl: string | undefined = data.logoPhotoUrl ?? undefined;
    let ownerPhotoUrl: string | undefined = data.ownerPhotoUrl ?? undefined;
    const logoFile = data.logoPhotoFile;
    const ownerFile = data.ownerPhotoFile;

    if (logoFile instanceof File) {
      try {
        const response = await imageUploader.upload(logoFile, {
          metadata: { businessSlug },
        });
        const fileLocation =
          (response.file.objectInfo.metadata?.pathname as string | undefined) ??
          "";
        if (fileLocation) logoPhotoUrl = fileLocation;
      } catch {
        toast.error("Failed to upload logo.");
        return;
      }
    }

    if (ownerFile instanceof File) {
      try {
        const response = await imageUploader.upload(ownerFile, {
          metadata: { businessSlug },
        });

        const fileLocation =
          (response.file.objectInfo.metadata?.pathname as string | undefined) ??
          "";
        if (fileLocation) ownerPhotoUrl = fileLocation;

        console.log(ownerPhotoUrl);
      } catch {
        toast.error("Failed to upload owner photo.");
        return;
      }
    }

    if (!initialData) {
      createShop.mutate({
        ...data,
        ownerPhotoUrl,
        logoPhotoUrl,
      });
    } else {
      updateShop.mutate({
        id: initialData.id,
        ...data,
        ownerPhotoUrl,
        logoPhotoUrl,
      });
    }
  };

  const handleReset = (data?: ShopFormData) => {
    if (data)
      form.reset({
        ...data,
        ownerPhotoFile: null,
        logoPhotoFile: null,
      });
    else form.reset(initialFormValues);

    if (logoFileInputRef.current) logoFileInputRef.current.value = "";
    if (ownerFileInputRef.current) ownerFileInputRef.current.value = "";
  };

  const isPending =
    updateShop.isPending || createShop.isPending || imageUploader.isPending;

  const isDirty = form.formState.isDirty;

  useDirtyForm(isDirty);
  useKeyboardEnter(form, handleSubmit);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)}
          className="min-h-screen"
          ref={formRef}
        >
          <div className={cn("admin-form-toolbar", isDirty ? "dirty" : "")}>
            <div className="toolbar-info">
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href="/admin/shops">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="bg-border hidden h-6 w-px shrink-0 sm:block" />
              <div className="hidden min-w-0 items-center gap-2 sm:flex">
                <h1 className="text-base font-medium">
                  {initialData ? form.watch("name") || "Edit Shop" : "New Shop"}
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
            <div className="flex flex-col gap-4 p-1 md:grid md:grid-cols-12">
              {/* Left Column */}
              <div className="col-span-6 flex flex-col gap-4">
                {/* Visibility Section */}
                <Card>
                  <CardContent>
                    <FancySwitchFormField
                      form={form}
                      name="isPublic"
                      label="Publicly visible"
                      description="Hidden shops don't appear in the directory or at their page URL."
                    />
                  </CardContent>
                </Card>

                {/* Basic Info Section */}

                <Card>
                  <CardHeader>
                    <CardTitle>Shop Information</CardTitle>
                    <CardDescription>
                      Break down the basics of your shop here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {userRole === "ADMIN" && (
                      <>
                        {!potentialShopOwners ||
                        potentialShopOwners?.length === 0 ? (
                          <div className="flex flex-col gap-2">
                            <FormLabel>
                              Who is the owner of this shop?
                            </FormLabel>
                            <p className="text-muted-foreground text-sm">
                              You are the owner of this shop.
                            </p>
                          </div>
                        ) : (
                          <SelectFormField
                            form={form}
                            name="ownerId"
                            label="Select a current elevated user to be the owner of this shop *"
                            values={potentialShopOwners.map((owner) => ({
                              key: owner.name,
                              value: owner.id,
                              label: owner.name,
                            }))}
                            onValueChange={(value) => {
                              form.setValue(
                                "ownerName",
                                potentialShopOwners.find(
                                  (owner) => owner.id === value,
                                )?.name ?? "",
                              );
                            }}
                          />
                        )}
                      </>
                    )}

                    <InputFormField
                      form={form}
                      name="name"
                      label="What is your shop name? *"
                      className="w-full"
                      placeholder="e.g. The Best Shop Ever Co."
                    />
                    <TextareaFormField
                      form={form}
                      name="description"
                      label="Tell us a bit about your shop!"
                      className="w-full"
                      placeholder="e.g. We sell the best products in the world!"
                    />

                    <InputFormField
                      form={form}
                      name="website"
                      label="What is your shop's website?"
                      placeholder="e.g. https://thebestshopever.com"
                      className="w-full"
                    />
                    <InputFormField
                      form={form}
                      name="email"
                      label="What is your shop's public email?"
                      className="w-full"
                      placeholder="e.g. info@thebestshopever.com"
                    />
                    <InputFormField
                      form={form}
                      name="phone"
                      label="What is your shop's public phone number?"
                      className="w-full"
                      placeholder="e.g. (555) 555-5555"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Owner Information</CardTitle>
                    <CardDescription>
                      We like to show off the artisans here at AF. The following
                      fields are used to flush out your shop page.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <InputFormField
                      form={form}
                      name="ownerName"
                      label="Owner Name *"
                      className="w-full"
                      placeholder="Jane Doe"
                    />

                    <ImageUploadFormField
                      form={form}
                      name="ownerPhotoFile"
                      label="Owner Photo"
                      description="Upload your store owner photo image here!"
                      disabled={isPending}
                      existingPreviewUrl={initialData?.ownerPhoto ?? undefined}
                      inputRef={ownerFileInputRef}
                    />

                    <TextareaFormField
                      form={form}
                      name="bio"
                      label="Share a bit about yourself here!"
                      className="w-full"
                      placeholder="Jane Doe is the proud owner of..."
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="col-span-6 flex flex-col gap-4">
                {/* Address Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shop Branding</CardTitle>
                    <CardDescription>
                      Add the branding assets for your shop here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ImageUploadFormField
                      form={form}
                      name="logoPhotoFile"
                      label="Logo image"
                      description="Upload your store logo image here!"
                      disabled={isPending}
                      existingPreviewUrl={initialData?.logoPhoto ?? undefined}
                      inputRef={logoFileInputRef}
                    />

                    <div className="space-y-2">
                      <FormLabel htmlFor="shop-attributes">
                        Shop Attributes
                      </FormLabel>
                      <p className="text-muted-foreground text-sm">
                        Select the attributes that best describe your shop.
                      </p>

                      <div
                        id="shop-attributes"
                        className="flex flex-wrap gap-4 pt-4"
                      >
                        {STORE_ATTRIBUTES.map((attribute) => (
                          <div
                            key={attribute}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={attribute}
                              checked={form
                                ?.watch("attributeTags")
                                ?.includes(attribute)}
                              onCheckedChange={(checked) => {
                                const currentTags = form.watch("attributeTags");
                                if (checked) {
                                  form.setValue("attributeTags", [
                                    ...currentTags,
                                    attribute,
                                  ]);
                                } else {
                                  form.setValue(
                                    "attributeTags",
                                    currentTags.filter(
                                      (tag) => tag !== attribute,
                                    ),
                                  );
                                }
                              }}
                            />
                            <Label htmlFor={attribute}>{attribute}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Business Address (Optional)</CardTitle>
                    <CardDescription>
                      If you want to have your business address listed on your
                      shop page, please fill out the following fields.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-3">
                      <InputFormField
                        form={form}
                        name="address"
                        label="Street Address"
                        className="w-full"
                        placeholder="e.g. 123 Main St"
                      />
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <InputFormField
                          form={form}
                          name="city"
                          label="City"
                          className="col-span-1"
                          placeholder="e.g. Detroit"
                        />
                        <InputFormField
                          form={form}
                          name="state"
                          label="State"
                          className="col-span-1"
                          placeholder="e.g. MI"
                        />
                        <InputFormField
                          form={form}
                          name="zip"
                          label="ZIP Code"
                          className="col-span-1"
                          placeholder="e.g. 48201"
                        />
                      </div>
                    </div>
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
            <AlertDialogTitle>Delete shop</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{form.watch("name")}&quot;?
              This action cannot be undone. This will permanently delete the
              shop and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteShop.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteShop.mutate({ shopId: initialData?.id ?? "" });
              }}
              disabled={deleteShop.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteShop.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
