"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";

import type { Shop } from "@prisma/client";
import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";

import type { ShopFormValues } from "../_validators/schema";
import { env } from "~/env";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { useDefaultMutationActions } from "~/hooks/use-default-mutation-actions";
import { Button, buttonVariants } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import * as Form from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { ImageFormField } from "~/components/inputs";

import { shopFormSchema } from "../_validators/schema";

type Props = {
  initialData: Shop | null;
  onboardingView?: boolean;
};

export const ShopForm: React.FC<Props> = ({
  initialData,
  onboardingView = false,
}) => {
  const { defaultActions } = useDefaultMutationActions({
    entity: "shop",
  });

  const { data: session } = useSession();
  const params = useParams();

  const { shopId } = params as { shopId: string };

  const form = useForm<ShopFormValues>({
    resolver: zodResolver(shopFormSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      ownerName: initialData?.ownerName ?? "",
      bio: initialData?.bio ?? "",
      description: initialData?.description ?? "",
      logoPhoto: initialData?.logoPhoto ?? "",
      ownerPhoto: initialData?.ownerPhoto ?? "",
      website: initialData?.website ?? "",
    },
  });

  const updateRoleMutation = api.auth.changeRole.useMutation({
    onSuccess: () => toastService.success({ message: "Role updated." }),
    onError: (error) =>
      toastService.error({
        message: "Something went wrong with updating your role.",
        error,
      }),
  });

  const updateShopMutation = api.shop.update.useMutation({
    ...defaultActions,
    onSuccess: (data) => {
      defaultActions.onSuccess?.(data);

      if (session?.user?.role !== "ADMIN") {
        updateRoleMutation.mutate({
          role: "ARTISAN",
        });
      }
    },
  });

  const onSubmit = (data: ShopFormValues) => {
    updateShopMutation.mutate({
      ...data,
      id: shopId,
    });
  };

  const loading = updateShopMutation.isPending || updateRoleMutation.isPending;

  return (
    <ScrollArea className="h-full w-full">
      {!onboardingView && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">
              {initialData?.name} Dashboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure how your store is shown to visitors
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/shops"
              className={cn(buttonVariants({ variant: "outline" }), "h-9")}
            >
              Manage Shop
            </Link>

            <Link
              href="/admin/products"
              className={cn(buttonVariants({ variant: "default" }), "h-9")}
            >
              Add Products
            </Link>
          </div>
        </div>
      )}
      <Separator className="mb-8" />

      <Form.Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="mx-auto max-w-4xl space-y-8 pb-16"
        >
          <Card className="p-6">
            <h3 className="mb-6 text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <Form.FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Form.FormItem className="sm:col-span-3">
                    <Form.FormLabel>Shop Name</Form.FormLabel>
                    <Form.FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Shop name"
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormDescription>
                      This is the shop name which will appear on the shop page.
                    </Form.FormDescription>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />

              <Form.FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <Form.FormItem className="sm:col-span-3">
                    <Form.FormLabel>Owner&apos;s Name</Form.FormLabel>
                    <Form.FormControl>
                      <Input
                        disabled={loading}
                        placeholder="Owner's name"
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormDescription>
                      This is the shop owner whose name will be present on the
                      shop page.
                    </Form.FormDescription>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 text-lg font-medium">Shop Images</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ImageFormField
                form={form}
                name="ownerPhoto"
                className="col-span-1"
                label="Owner Photo"
                currentImageUrl={
                  initialData
                    ? `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${initialData.ownerPhoto}`
                    : undefined
                }
              />
              <ImageFormField
                form={form}
                name="logoPhoto"
                className="col-span-1"
                label="Logo"
                currentImageUrl={
                  initialData
                    ? `${env.NEXT_PUBLIC_STORAGE_URL}/shops/${initialData.logoPhoto}`
                    : undefined
                }
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 text-lg font-medium">Shop Details</h3>
            <div className="space-y-6">
              <Form.FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <Form.FormItem>
                    <Form.FormLabel>Bio for the Shop Page</Form.FormLabel>
                    <Form.FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. Hey, my name is..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormDescription>
                      For the shop page: Tell the world who you are!
                    </Form.FormDescription>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />

              <Form.FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Form.FormItem>
                    <Form.FormLabel>Shop Description</Form.FormLabel>
                    <Form.FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. Shop is the best!"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormDescription>
                      For the shop page: Tell the world what your business is
                      about! What do you sell? What is your mission? What other
                      details you want visitors to know?
                    </Form.FormDescription>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />

              <Form.FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <Form.FormItem>
                    <Form.FormLabel>Website</Form.FormLabel>
                    <Form.FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. https://test.co"
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              disabled={loading}
              type="submit"
              size="lg"
              className="min-w-[150px]"
            >
              Save changes
            </Button>
          </div>
        </form>
      </Form.Form>
    </ScrollArea>
  );
};
