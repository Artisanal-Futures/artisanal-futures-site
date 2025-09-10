"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { MultiSelectFormField, type OptionType } from "~/components/inputs/multi-select-form-field";
import { TagFormField } from "~/components/inputs/tag-form-field";

const bulkUpdateFormSchema = z.object({
  categoryIds: z.array(z.string()).optional(),
  tags: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  isPublic: z.boolean().optional(),
  shopId: z.string().optional(),
});

type BulkUpdateFormValues = z.infer<typeof bulkUpdateFormSchema>;

type Props = {
  productIds: string[];
  onSuccessCallback: () => void;
  dialogRef?: React.RefObject<HTMLDivElement>;
};

export function BulkProductForm({ productIds, onSuccessCallback, dialogRef }: Props) {
  const utils = api.useUtils();

  const { data: categories } = api.category.getAll.useQuery();
  const { data: shops } = api.shop.getAll.useQuery();

  const bulkUpdateMutation = api.product.bulkUpdate.useMutation({
    onSuccess: async (data) => {
      toast.success(data.message);
      await utils.product.getAll.invalidate();
      onSuccessCallback();
    },
    onError: (error) => {
      toast.error(`Error updating products: ${error.message}`);
    },
  });

  const form = useForm<BulkUpdateFormValues>({
    resolver: zodResolver(bulkUpdateFormSchema),
    defaultValues: {
      categoryIds: [],
      tags: [],
      isPublic: undefined,
      shopId: undefined,
    },
  });

  const onSubmit = (data: BulkUpdateFormValues) => {
    const dataToSubmit: Record<string, unknown> = {};
    if (form.formState.dirtyFields.categoryIds) dataToSubmit.categoryIds = data.categoryIds;
    if (form.formState.dirtyFields.tags) dataToSubmit.tags = data.tags?.map(t => t.text);
    if (form.formState.dirtyFields.isPublic) dataToSubmit.isPublic = data.isPublic;
    if (form.formState.dirtyFields.shopId) dataToSubmit.shopId = data.shopId;

    if (Object.keys(dataToSubmit).length === 0) {
      toast.info("No changes were made.");
      onSuccessCallback();
      return;
    }

    bulkUpdateMutation.mutate({
      productIds,
      ...dataToSubmit,
    });
  };

  const categoryOptions: OptionType[] =
    categories
      ?.filter((cat) => cat.type === "PRODUCT")
      .map((cat) => ({
        value: cat.id,
        label: `${cat.parent ? `${cat.parent.name} / ` : ''}${cat.name}`,
      })) ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <p className="text-sm text-muted-foreground">
          You are editing {productIds.length} products. Only the fields you change will be updated.
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="categoryIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Categories</FormLabel>
                <MultiSelectFormField
                  options={categoryOptions}
                  selected={field.value ?? []}
                  onChange={field.onChange}
                  placeholder="Select categories to assign..."
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Tags</FormLabel>
                <TagFormField
                  form={form}
                  name="tags"
                  label=""
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shopId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign to Shop</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a shop to assign" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shops?.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>Public Visibility</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Make these products visible on the public website.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onSuccessCallback}>
            Cancel
          </Button>
          <Button type="submit" disabled={bulkUpdateMutation.isPending}>
            {bulkUpdateMutation.isPending ? "Updating..." : "Update Products"}
          </Button>
        </div>
      </form>
    </Form>
  );
}