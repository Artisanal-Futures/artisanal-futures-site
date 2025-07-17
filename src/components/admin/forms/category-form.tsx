"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { type Category } from "@prisma/client";
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
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  parentId: z.string().nullable().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

type Props = {
  initialData: Category | null;
  onSuccessCallback: () => void;
};

export function CategoryForm({ initialData, onSuccessCallback }: Props) {
  const utils = api.useUtils();

  const { data: categories } = api.category.getAll.useQuery();

  const createCategory = api.category.create.useMutation({
    onSuccess: async () => {
      toast.success("Category created successfully.");
      await utils.category.getAll.invalidate(); 
      onSuccessCallback();
    },
    onError: (error) => {
      toast.error(`Error creating category: ${error.message}`);
    },
  });

  const updateCategory = api.category.update.useMutation({
    onSuccess: async () => {
      toast.success("Category updated successfully.");
      await utils.category.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(`Error updating category: ${error.message}`);
    },
  });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      parentId: initialData?.parentId,
    },
  });

  const onSubmit = (data: CategoryFormValues) => {
    if (initialData) {
      updateCategory.mutate({ id: initialData.id, ...data });
    } else {
      createCategory.mutate(data);
    }
  };

  const isLoading = createCategory.isPending || updateCategory.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Clothing" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Category (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">None (Top-Level Category)</SelectItem>
                    {categories
                      ?.filter((cat) => !cat.parentId && cat.id !== initialData?.id) 
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Category"}
        </Button>
      </form>
    </Form>
  );
}
