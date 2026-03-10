"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CategoryType } from "generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { CategoryFormValues } from "~/lib/validators/category";
import type { RouterOutputs } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { categorySchema } from "~/lib/validators/category";
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
import { InputFormField } from "~/components/inputs/input-form-field";
import { SelectFormField } from "~/components/inputs/select-form-field";

type Props = {
  initialData: RouterOutputs["category"]["get"];
  categories: RouterOutputs["category"]["getAll"];
};

export function CategoryForm({ initialData, categories }: Props) {
  const apiUtils = api.useUtils();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const createCategory = api.category.create.useMutation({
    onSuccess: ({ message, data }) => {
      toast.dismiss();
      toast.success(message);
      handleReset(data);
      void apiUtils.category.invalidate();
      router.push(`/admin/categories/${data.id}`);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to create category.");
    },
    onMutate: () => {
      toast.loading("Creating category, please wait...");
    },
  });

  const updateCategory = api.category.update.useMutation({
    onSuccess: ({ message, data }) => {
      toast.dismiss();
      toast.success(message);
      handleReset(data);
      void apiUtils.category.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to update category.");
    },
    onMutate: () => {
      toast.loading("Updating product, please wait...");
    },
  });

  const deleteCategory = api.category.delete.useMutation({
    onSuccess: ({ message }) => {
      toast.dismiss();
      toast.success(message);
      void apiUtils.category.invalidate();
      router.push("/admin/categories");
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message ?? "Failed to delete category.");
    },
    onMutate: () => {
      toast.loading("Deleting category, please wait...");
    },
  });
  const defaultValues: CategoryFormValues = {
    name: initialData?.name ?? "",
    parentId: initialData?.parentId,
    type: initialData?.type ?? CategoryType.PRODUCT,
  };

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  const handleSubmit = async (data: CategoryFormValues) => {
    if (initialData) {
      updateCategory.mutate({ id: initialData.id, ...data });
    } else {
      createCategory.mutate(data);
    }
  };
  const handleReset = (data?: CategoryFormValues) => {
    if (data) form.reset(data);
    else form.reset(defaultValues);
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  const selectedType = form.watch("type");

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
                    ? form.watch("name") || "Edit Category"
                    : "New Category"}
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
                    <CardTitle>Category Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <InputFormField
                      form={form}
                      name="name"
                      label="Category Name"
                      placeholder="e.g., Clothing"
                    />

                    <SelectFormField
                      form={form}
                      name="parentId"
                      label="Parent Category (Optional)"
                      placeholder="Select a parent category"
                      values={[
                        { value: "null", label: "None (Top-Level Category)" },
                        ...categories
                          ?.filter(
                            (cat) =>
                              !cat.parentId &&
                              cat.id !== initialData?.id &&
                              cat.type === selectedType,
                          )
                          .map((category) => ({
                            value: category.id,
                            label: category.name,
                          })),
                      ]}
                    />

                    <SelectFormField
                      form={form}
                      name="type"
                      label="Category Type"
                      disabled={!!initialData}
                      placeholder="Select a category type"
                      values={[
                        { value: CategoryType.PRODUCT, label: "Product" },
                        { value: CategoryType.SERVICE, label: "Service" },
                      ]}
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
            <AlertDialogTitle>Delete category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{form.watch("name")}&quot;?
              This action cannot be undone. This will permanently delete the
              category and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteCategory.mutate({ id: initialData?.id ?? "" });
              }}
              disabled={deleteCategory.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
