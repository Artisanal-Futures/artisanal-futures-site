"use client";

import type { FieldErrors, Resolver } from "react-hook-form";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUploadFile } from "@better-upload/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ExternalLink, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { ShopFormData } from "~/lib/validators/shop";
import type { RouterOutputs } from "~/trpc/react";
import { STORE_ATTRIBUTES } from "~/lib/constants/store-attributes";
import { handleImageUrl } from "~/lib/handle-image-url";
import { shopPath } from "~/lib/seo/paths";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { FancySwitchFormField } from "~/components/inputs/fancy-switch-form-field";
import { ImageUploadFormField } from "~/components/inputs/image-upload-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { SelectFormField } from "~/components/inputs/select-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";
import { UrlListFormField } from "~/components/inputs/url-list-form-field";

import { ShopLocationCard } from "./shop-location-card";
import { ShopSeoCard } from "./shop-seo-card";

const TAB_ORDER = [
  "profile",
  "contact",
  "location",
  "seo",
  "ownership",
] as const;
type TabKey = (typeof TAB_ORDER)[number];

const TAB_LABELS: Record<TabKey, string> = {
  profile: "Profile",
  contact: "Contact & links",
  location: "Location",
  seo: "Search & sharing",
  ownership: "Ownership",
};

/** Which tab each top-level form field lives on (unlisted fields: profile). */
const FIELD_TAB: Record<string, TabKey> = {
  name: "profile",
  description: "profile",
  ownerName: "profile",
  ownerPhotoFile: "profile",
  ownerPhotoUrl: "profile",
  bio: "profile",
  logoPhotoFile: "profile",
  logoPhotoUrl: "profile",
  coverPhotoFile: "profile",
  coverPhotoUrl: "profile",
  attributeTags: "profile",
  isPublic: "profile",
  website: "contact",
  email: "contact",
  phone: "contact",
  socialLinks: "contact",
  locationType: "location",
  address: "location",
  city: "location",
  state: "location",
  zip: "location",
  country: "location",
  seo: "seo",
  seoImageFile: "seo",
  ownerId: "ownership",
};

const getErrorTabs = (errors: FieldErrors<ShopFormData>) =>
  new Set(Object.keys(errors).map((field) => FIELD_TAB[field] ?? "profile"));

type Props = {
  initialData: RouterOutputs["shop"]["get"];
  userRole: string;
  /** Create mode only: ownership of an existing shop changes via transfer. */
  potentialShopOwners?: RouterOutputs["shop"]["getShopOwners"];
  /** Edit mode, admins: cards for the Ownership tab (they have their own forms). */
  ownershipSlot?: React.ReactNode;
};

export function ShopForm({
  initialData,
  userRole,
  potentialShopOwners = [],
  ownershipSlot,
}: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const apiUtils = api.useUtils();

  const formRef = useRef<HTMLFormElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const ownerFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  const seoImageInputRef = useRef<HTMLInputElement | null>(null);

  // Slug and search/share fields are admin-only, and only admins' requests
  // may carry them (shop.create/update reject `seo` from anyone else).
  const isAdmin = userRole === "ADMIN";

  const visibleTabs = TAB_ORDER.filter(
    (tab) => isAdmin || (tab !== "seo" && tab !== "ownership"),
  );
  const requestedTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(
    visibleTabs.find((tab) => tab === requestedTab) ?? "profile",
  );

  const changeTab = (tab: TabKey) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "profile") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    // replaceState (not router.replace) so switching tabs doesn't re-run the
    // server page; Next keeps useSearchParams in sync with it.
    window.history.replaceState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
  };

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
    locationType: initialData?.locationType ?? "HOME_BASED",
    attributeTags: initialData?.attributeTags ?? [],
    socialLinks: initialData?.socialLinks ?? [],
    ownerId: initialData?.ownerId ?? "",
    isPublic: initialData?.isPublic ?? true,

    ownerPhotoUrl: initialData?.ownerPhoto
      ? handleImageUrl(initialData.ownerPhoto)
      : undefined,
    logoPhotoUrl: initialData?.logoPhoto
      ? handleImageUrl(initialData.logoPhoto)
      : undefined,
    coverPhotoUrl: initialData?.coverPhoto
      ? handleImageUrl(initialData.coverPhoto)
      : undefined,

    ownerPhotoFile: null,
    logoPhotoFile: null,
    coverPhotoFile: null,
    seoImageFile: null,

    ...(isAdmin
      ? {
          seo: {
            slug: initialData?.slug ?? "",
            seoTitle: initialData?.seoTitle ?? "",
            seoDescription: initialData?.seoDescription ?? "",
            seoImageUrl: initialData?.seoImage ?? "",
            seoNoIndex: initialData?.seoNoIndex ?? false,
          },
        }
      : {}),
  };

  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopFormSchema) as Resolver<ShopFormData>,
    defaultValues: initialFormValues,
  });

  const updateShop = api.shop.update.useMutation({
    onSuccess: ({ message }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      void apiUtils.shop.invalidate();
      router.refresh();
    },
    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to update shop.", {
        id: context?.toastId,
      });
    },
    onMutate: () => ({
      toastId: toast.loading("Updating shop, please wait..."),
    }),
  });

  const createShop = api.shop.create.useMutation({
    onSuccess: ({ message, data }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      void apiUtils.shop.invalidate();
      router.push(`/admin/shops/${data.id}`);
    },
    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to create shop.", {
        id: context?.toastId,
      });
    },
    onMutate: () => ({
      toastId: toast.loading("Creating shop, please wait..."),
    }),
  });

  const deleteShop = api.shop.delete.useMutation({
    onSuccess: ({ message }, _input, context) => {
      toast.success(message, { id: context?.toastId });
      void apiUtils.shop.invalidate();
      router.push("/admin/shops");
    },
    onError: (error, _input, context) => {
      toast.error(error.message ?? "Failed to delete shop.", {
        id: context?.toastId,
      });
    },
    onMutate: () => ({
      toastId: toast.loading("Deleting shop, please wait..."),
    }),
  });

  const imageUploader = useUploadFile({
    api: "/api/upload",
    route: "shopImage",
    onError: (error) => {
      toast.error(error.message ?? "Image upload failed.");
    },
  });

  /** Uploads a newly picked image; returns its URL, or false on failure. */
  const uploadImage = async (
    file: File | null | undefined,
    businessSlug: string,
    label: string,
  ): Promise<string | undefined | false> => {
    if (!(file instanceof File)) return undefined;
    try {
      const response = await imageUploader.upload(file, {
        metadata: { businessSlug },
      });
      const fileLocation =
        (response.file.objectInfo.metadata?.pathname as string | undefined) ??
        "";
      return fileLocation === "" ? undefined : fileLocation;
    } catch {
      toast.error(`Failed to upload ${label}.`);
      return false;
    }
  };

  const handleSubmit = async (data: ShopFormData) => {
    const businessSlug = slugify(data.name);

    const uploads = await Promise.all([
      uploadImage(data.logoPhotoFile, businessSlug, "logo"),
      uploadImage(data.ownerPhotoFile, businessSlug, "owner photo"),
      uploadImage(data.coverPhotoFile, businessSlug, "cover photo"),
      uploadImage(data.seoImageFile, businessSlug, "share image"),
    ]);
    if (uploads.includes(false)) return;
    const [logoUpload, ownerUpload, coverUpload, seoImageUpload] = uploads as (
      | string
      | undefined
    )[];

    const logoPhotoUrl = logoUpload ?? data.logoPhotoUrl ?? undefined;
    const ownerPhotoUrl = ownerUpload ?? data.ownerPhotoUrl ?? undefined;
    const coverPhotoUrl = coverUpload ?? data.coverPhotoUrl ?? undefined;

    // Never send `seo` for artisans: the server rejects it.
    const seo =
      isAdmin && data.seo
        ? {
            ...data.seo,
            seoImageUrl: seoImageUpload ?? data.seo.seoImageUrl,
          }
        : undefined;

    const payload = {
      ...data,
      // The server clears an AREA shop's street; mirror it here so the hidden
      // field doesn't keep (and later re-send) the old street.
      address: data.locationType === "AREA" ? "" : data.address,
      ownerPhotoUrl,
      logoPhotoUrl,
      coverPhotoUrl,
      seo,
    };

    if (!initialData) {
      createShop.mutate(payload);
    } else {
      // Ownership changes only through `shop.transferOwnership`.
      const updatePayload = { ...payload, ownerId: undefined };
      updateShop.mutate(
        { id: initialData.id, ...updatePayload },
        {
          // Keep what was saved (incl. uploaded URLs and an auto-assigned
          // slug) as the new clean state.
          onSuccess: ({ data: saved }) =>
            handleReset({
              ...payload,
              ...(seo
                ? {
                    // Validated values use null for blanks; inputs want "".
                    seo: {
                      slug: saved.slug ?? seo.slug,
                      seoTitle: seo.seoTitle ?? "",
                      seoDescription: seo.seoDescription ?? "",
                      seoImageUrl: seo.seoImageUrl ?? "",
                      seoNoIndex: seo.seoNoIndex,
                    },
                  }
                : {}),
            }),
        },
      );
    }
  };

  const handleReset = (data?: ShopFormData) => {
    if (data)
      form.reset({
        ...data,
        ownerPhotoFile: null,
        logoPhotoFile: null,
        coverPhotoFile: null,
        seoImageFile: null,
      });
    else form.reset(initialFormValues);

    if (logoFileInputRef.current) logoFileInputRef.current.value = "";
    if (ownerFileInputRef.current) ownerFileInputRef.current.value = "";
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    if (seoImageInputRef.current) seoImageInputRef.current.value = "";
  };

  const isPending =
    updateShop.isPending || createShop.isPending || imageUploader.isPending;

  const isDirty = form.formState.isDirty;

  const errorTabs = getErrorTabs(form.formState.errors);

  /** Jump to the first tab (in tab order) that has an invalid field. */
  const handleInvalid = (errors: FieldErrors<ShopFormData>) => {
    const invalidTabs = getErrorTabs(errors);
    const firstTab = visibleTabs.find((tab) => invalidTabs.has(tab));
    if (firstTab && firstTab !== activeTab) changeTab(firstTab);
  };

  useDirtyForm(isDirty);
  useKeyboardEnter(form, handleSubmit, handleInvalid);

  return (
    <>
      <Form {...form}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => changeTab(value as TabKey)}
          className="min-h-screen gap-0"
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
                  variant="outline"
                  size="sm"
                  asChild
                  aria-label={
                    initialData.isPublic ? "View shop" : "Preview shop"
                  }
                >
                  <Link
                    href={shopPath({
                      id: initialData.id,
                      slug: initialData.slug,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">
                      {initialData.isPublic ? "View shop" : "Preview shop"}
                    </span>
                  </Link>
                </Button>
              )}

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

              <Button
                type="submit"
                form="shop-form"
                size="sm"
                disabled={isPending}
              >
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

          <div className="admin-container w-full space-y-6">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <TabsList className="w-max">
                {visibleTabs.map((tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {TAB_LABELS[tab]}
                    {errorTabs.has(tab) && (
                      <>
                        <span
                          aria-hidden
                          className="bg-destructive size-1.5 rounded-full"
                        />
                        <span className="sr-only">has errors</span>
                      </>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <form
              id="shop-form"
              onSubmit={(e) =>
                void form.handleSubmit(handleSubmit, handleInvalid)(e)
              }
              ref={formRef}
            >
              {/* Tabs stay mounted (just hidden) so file inputs and field
                  errors survive switching. */}
              <TabsContent
                value="profile"
                forceMount
                className="max-w-3xl space-y-6 data-[state=inactive]:hidden"
              >
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

                <Card>
                  <CardHeader>
                    <CardTitle>Shop Information</CardTitle>
                    <CardDescription>
                      Break down the basics of your shop here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>About the Owner</CardTitle>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Shop Branding</CardTitle>
                    <CardDescription>
                      Add the branding assets for your shop here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <ImageUploadFormField
                        form={form}
                        name="logoPhotoFile"
                        label="Logo image"
                        description="Upload your store logo image here!"
                        disabled={isPending}
                        existingPreviewUrl={initialData?.logoPhoto ?? undefined}
                        inputRef={logoFileInputRef}
                      />

                      <ImageUploadFormField
                        form={form}
                        name="coverPhotoFile"
                        label="Cover photo"
                        description="A wide photo of your work or workspace. Also used when your shop is shared online."
                        disabled={isPending}
                        existingPreviewUrl={
                          initialData?.coverPhoto ?? undefined
                        }
                        inputRef={coverFileInputRef}
                      />
                    </div>

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
              </TabsContent>

              <TabsContent
                value="contact"
                forceMount
                className="max-w-3xl space-y-6 data-[state=inactive]:hidden"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Contact &amp; Links</CardTitle>
                    <CardDescription>
                      How customers can find and reach your shop. These are
                      shown publicly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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

                    <UrlListFormField
                      form={form}
                      name="socialLinks"
                      label="Social links"
                      description="Your shop's profiles elsewhere (Instagram, Facebook, Etsy, ...). Full URLs, starting with https://."
                      disabled={isPending}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="location"
                forceMount
                className="max-w-3xl space-y-6 data-[state=inactive]:hidden"
              >
                <ShopLocationCard form={form} disabled={isPending} />
              </TabsContent>

              {isAdmin && (
                <TabsContent
                  value="seo"
                  forceMount
                  className="max-w-3xl space-y-6 data-[state=inactive]:hidden"
                >
                  <ShopSeoCard
                    form={form}
                    shop={initialData}
                    disabled={isPending}
                    seoImageInputRef={seoImageInputRef}
                  />
                </TabsContent>
              )}

              {/* Create mode: the owner is picked here, inside the form. */}
              {isAdmin && !initialData && (
                <TabsContent
                  value="ownership"
                  forceMount
                  className="max-w-3xl space-y-6 data-[state=inactive]:hidden"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Owner</CardTitle>
                      <CardDescription>
                        Who this shop belongs to.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {potentialShopOwners.length === 0 ? (
                        <div className="flex flex-col gap-2">
                          <FormLabel>Who is the owner of this shop?</FormLabel>
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
                    </CardContent>
                  </Card>
                  <p className="text-muted-foreground text-sm">
                    Save the shop first to add private contact details and
                    invite an owner.
                  </p>
                </TabsContent>
              )}
            </form>

            {/* Edit mode: owner and private-contact cards have their own
                forms/queries, so they live outside the main form. */}
            {isAdmin && initialData && (
              <TabsContent value="ownership" className="max-w-3xl space-y-6">
                {ownershipSlot}
              </TabsContent>
            )}
          </div>
        </Tabs>
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
                deleteShop.mutate({ id: initialData?.id ?? "" });
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
