"use client";

import { useForm } from "react-hook-form";

import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";

import type { ShopFormSchema } from "../_validators/schema";
import type { Shop } from "~/types/shop";
import { env } from "~/env";
import { useFileUpload } from "~/lib/file-upload/hooks/use-file-upload";
import { api } from "~/trpc/react";
import { useDefaultMutationActions } from "~/hooks/use-default-mutation-actions";
import { usePermissions } from "~/hooks/use-permissions";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Form } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { LoadButton } from "~/components/common/load-button";
import { SelectFormField } from "~/components/inputs";
import { ImageFormField } from "~/components/inputs/image-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";

import { shopFormSchema } from "../_validators/schema";

type Props = {
  initialData: Shop | null;
  onSuccessCallback: () => void;
};

const STORE_ATTRIBUTES = [
  "African American Culture",
  "African Culture",
  "African American Civil Rights",
  "Black Owned",
  "Woman Owned",
  "Community Education",
  "Food Sovereignty",
] as const;

export function ShopForm({ initialData, onSuccessCallback }: Props) {
  const shopOwners = api.shop.getShopOwners.useQuery();

  const { userRole } = usePermissions();

  const { uploadFile, isUploading } = useFileUpload({
    route: "shops",
    api: "/api/upload-shop",
    generateThumbnail: false,
  });

  const { defaultSuccess, defaultError, defaultSettled } =
    useDefaultMutationActions({
      entity: "shop",
    });

  const form = useForm<ShopFormSchema>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      ownerName: initialData?.ownerName ?? "",
      bio: initialData?.bio ?? "",
      description: initialData?.description ?? "",
      ownerPhoto: null,
      logoPhoto: null,
      coverPhoto: null,
      website: initialData?.website ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      address: initialData?.address?.address ?? "",
      city: initialData?.address?.city ?? "",
      state: initialData?.address?.state ?? "",
      zip: initialData?.address?.zip ?? "",
      country: initialData?.address?.country ?? "",
      attributeTags: initialData?.attributeTags ?? [],

      ownerId: initialData?.ownerId ?? "",
    },
  });

  const updateShop = api.shop.update.useMutation({
    onSuccess: ({ message }) => {
      defaultSuccess({ message });
      onSuccessCallback();
    },
    onError: defaultError,
    onSettled: defaultSettled,
  });

  const createShop = api.shop.create.useMutation({
    onSuccess: ({ message }) => {
      defaultSuccess({ message });
      onSuccessCallback();
    },
    onError: defaultError,
    onSettled: defaultSettled,
  });

  async function onSubmit(data: ShopFormSchema) {
    let ownerPhotoUrl = initialData?.ownerPhoto;
    let logoPhotoUrl = initialData?.logoPhoto;
    let coverPhotoUrl = initialData?.coverPhoto;

    if (data.ownerPhoto) {
      ownerPhotoUrl = await uploadFile(data.ownerPhoto as File);
      if (!ownerPhotoUrl) {
        toastService.error("Error uploading owner photo");
        return;
      }
    }

    if (data.logoPhoto) {
      logoPhotoUrl = await uploadFile(data.logoPhoto as File);
      if (!logoPhotoUrl) {
        toastService.error("Error uploading logo");
        return;
      }
    }

    if (data.coverPhoto) {
      coverPhotoUrl = await uploadFile(data.coverPhoto as File);
      if (!coverPhotoUrl) {
        toastService.error("Error uploading cover photo");
        return;
      }
    }

    if (!initialData) {
      createShop.mutate({
        ...data,
        ownerPhoto: ownerPhotoUrl,
        logoPhoto: logoPhotoUrl,
        coverPhoto: coverPhotoUrl,
      });
    } else {
      updateShop.mutate({
        id: initialData.id,
        ...data,
        ownerPhoto: ownerPhotoUrl,
        logoPhoto: logoPhotoUrl,
        coverPhoto: coverPhotoUrl,
      });
    }
  }

  const isLoading = updateShop.isPending || createShop.isPending || isUploading;

  console.log(initialData);
  return (
    <Form {...form}>
      <form
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        className="h-full space-y-8"
      >
        <ScrollArea className="h-[60svh]" type="always">
          <div className="flex flex-col gap-4 p-1 md:grid md:grid-cols-12">
            {/* Left Column */}
            <div className="col-span-6 flex flex-col gap-4">
              {/* Basic Info Section */}
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                {userRole === "ADMIN" && (
                  <>
                    <h3 className="mb-3 text-lg font-medium text-primary">
                      Owner
                    </h3>
                    {shopOwners.data?.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No shop owners found.
                      </p>
                    )}

                    {shopOwners.data && (
                      <SelectFormField
                        form={form}
                        name="ownerId"
                        label="Owner"
                        values={shopOwners.data?.map((owner) => ({
                          key: owner.name,
                          value: owner.id,
                          label: owner.name,
                        }))}
                      />
                    )}
                  </>
                )}
                <h3 className="mb-3 text-lg font-medium text-primary">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InputFormField
                    form={form}
                    name="name"
                    label="Shop Name"
                    className="w-full"
                  />
                  <InputFormField
                    form={form}
                    name="ownerName"
                    label="Owner Name"
                    className="w-full"
                  />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  <TextareaFormField
                    form={form}
                    name="bio"
                    label="Bio"
                    className="w-full"
                  />
                  <TextareaFormField
                    form={form}
                    name="description"
                    label="Description"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Contact Info Section */}
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-lg font-medium text-primary">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <InputFormField
                    form={form}
                    name="website"
                    label="Website"
                    className="w-full"
                  />
                  <InputFormField
                    form={form}
                    name="email"
                    label="Email"
                    className="w-full"
                  />
                  <InputFormField
                    form={form}
                    name="phone"
                    label="Phone"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Store Attributes Section */}
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-lg font-medium text-primary">
                  Store Attributes
                </h3>
                <div className="flex flex-wrap gap-4">
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
                              currentTags.filter((tag) => tag !== attribute),
                            );
                          }
                        }}
                      />
                      <Label htmlFor={attribute}>{attribute}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-6 flex flex-col gap-4">
              {/* Address Section */}
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-lg font-medium text-primary">
                  Address
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <InputFormField
                    form={form}
                    name="address"
                    label="Street Address"
                    className="w-full"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InputFormField form={form} name="city" label="City" />
                    <InputFormField form={form} name="state" label="State" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputFormField form={form} name="zip" label="ZIP Code" />
                    <InputFormField
                      form={form}
                      name="country"
                      label="Country"
                    />
                  </div>
                </div>
              </div>

              {/* Shop Images Section */}
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <h3 className="mb-3 text-lg font-medium text-primary">
                  Shop Images
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <ImageFormField
                    form={form}
                    name="ownerPhoto"
                    label="Owner Photo"
                    className="col-span-2"
                    currentImageUrl={
                      initialData
                        ? `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${initialData.ownerPhoto}`
                        : undefined
                    }
                  />
                  <ImageFormField
                    form={form}
                    name="logoPhoto"
                    label="Logo"
                    className="col-span-2"
                    currentImageUrl={
                      initialData
                        ? `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${initialData.logoPhoto}`
                        : undefined
                    }
                  />
                  {/* <ImageFormField
                    form={form}
                    name="coverPhoto"
                    label="Cover Photo"
                    className="col-span-2"
                    currentImageUrl={
                      initialData
                        ? `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${initialData.coverPhoto}`
                        : undefined
                    }
                  /> */}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="mt-8 flex justify-end gap-2">
          <Button variant="outline" onClick={onSuccessCallback} type="button">
            Cancel
          </Button>
          <LoadButton isLoading={isLoading} loadingText="Saving shop...">
            {initialData ? "Update shop" : "Create shop"}
          </LoadButton>
        </div>
      </form>
    </Form>
  );
}
