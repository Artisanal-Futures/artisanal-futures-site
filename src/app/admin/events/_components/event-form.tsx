"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUploadFile } from "@better-upload/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { EventFormData } from "~/lib/validators/event";
import type { RouterOutputs } from "~/trpc/react";
import { cn, slugify } from "~/lib/utils";
import { eventFormSchema } from "~/lib/validators/event";
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
import { Form } from "~/components/ui/form";
import { DateTimeFormField } from "~/components/inputs/date-time-form-field";
import { ImageUploadFormField } from "~/components/inputs/image-upload-form-field";
import { InputFormField } from "~/components/inputs/input-form-field";
import { SelectFormField } from "~/components/inputs/select-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";

type Props = {
  initialData: RouterOutputs["event"]["get"];
  shops: RouterOutputs["shop"]["getAll"];
};

export function EventForm({ initialData, shops }: Props) {
  const imageUploader = useUploadFile({
    api: "/api/upload",
    route: "shopImage",
    onError: (error) => {
      toast.error(error.message ?? "Image upload failed.");
    },
  });

  const apiUtils = api.useUtils();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const createEvent = api.event.create.useMutation({
    onSuccess: ({ message, data }) => {
      toast.dismiss();
      toast.success(message);
      handleReset(data);
      void apiUtils.event.invalidate();
      router.push(`/admin/events/${data.id}`);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to create event.");
    },
    onMutate: () => {
      toast.loading("Creating event, please wait...");
    },
  });

  const updateEvent = api.event.update.useMutation({
    onSuccess: ({ message, data }) => {
      toast.dismiss();
      toast.success(message);
      handleReset(data);
      void apiUtils.event.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to update event.");
    },
    onMutate: () => {
      toast.loading("Updating event, please wait...");
    },
  });

  const deleteEvent = api.event.delete.useMutation({
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message);
      void apiUtils.event.invalidate();
      router.push("/admin/events");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete event.");
    },
    onMutate: () => {
      toast.loading("Deleting event, please wait...");
    },
  });
  const defaultValues: EventFormData = {
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    startDate: initialData?.startDate ?? new Date(),
    endDate: initialData?.endDate ?? undefined,
    location: initialData?.location ?? "",
    imageUrl: initialData?.imageUrl ?? "",
    callToActionLink: initialData?.callToActionLink ?? "",
    shopId: initialData?.shopId ?? "",
  };

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  });

  const handleSubmit = async (data: EventFormData) => {
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
        toast.error("Failed to upload event image.");
        return;
      }
    }

    if (initialData) {
      updateEvent.mutate({ ...data, id: initialData.id, imageUrl });
    } else {
      createEvent.mutate({ ...data, imageUrl });
    }
  };
  const handleReset = (data?: EventFormData) => {
    if (data) form.reset(data);
    else form.reset(defaultValues);
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

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
                <Link href="/admin/categories">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <div className="bg-border hidden h-6 w-px shrink-0 sm:block" />
              <div className="hidden min-w-0 items-center gap-2 sm:flex">
                <h1 className="text-base font-medium">
                  {initialData
                    ? form.watch("title") || "Edit Event"
                    : "New Event"}
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
            <div className="flex flex-col gap-4 md:grid md:grid-cols-6">
              <div className="col-span-3 flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <InputFormField
                      form={form}
                      name="title"
                      label="Event Title *"
                      placeholder="e.g., My Event"
                    />

                    <TextareaFormField
                      form={form}
                      name="description"
                      label="Event Description *"
                      placeholder="e.g., This is my event description"
                    />

                    <DateTimeFormField
                      form={form}
                      name="startDate"
                      label="Start Date"
                      description="Select a start date"
                      required
                    />
                    <DateTimeFormField
                      form={form}
                      name="endDate"
                      label="End Date"
                      description="Select an end date"
                    />

                    <InputFormField
                      form={form}
                      name="location"
                      label="Location"
                      placeholder="e.g., 123 Main St, Anytown, USA"
                    />

                    <InputFormField
                      form={form}
                      name="callToActionLink"
                      label="Call to Action Link"
                      placeholder="e.g., https://www.example.com"
                    />

                    <ImageUploadFormField
                      form={form}
                      name="imageFile"
                      label="Event image"
                      description="Upload your event image here!"
                      disabled={isPending}
                      existingPreviewUrl={initialData?.imageUrl ?? undefined}
                      inputRef={imageFileInputRef}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-3 flex flex-col gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Shop Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
            </div>
          </div>
        </form>
      </Form>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{form.watch("title")}&quot;?
              This action cannot be undone. This will permanently delete the
              event and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEvent.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteEvent.mutate(initialData?.id ?? "");
              }}
              disabled={deleteEvent.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEvent.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
