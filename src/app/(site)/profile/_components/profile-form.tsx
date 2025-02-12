"use client";

import type { z } from "zod";
import { useForm } from "react-hook-form";

import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import * as Form from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { AvatarImageFormField } from "~/components/inputs/avatar-image-form-field";

import { profileFormSchema } from "../_validators/schema";

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm(initialData: {
  username?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  const apiUtils = api.useUtils();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
    defaultValues: {
      username: initialData.username ?? "",
      name: initialData.name ?? "",
      image: initialData.image ?? "",
    },
  });

  const updateAccountMutation = api.user.update.useMutation({
    onSuccess: ({ message }) => toastService.success(message),
    onError: (error) => toastService.error({ message: error.message, error }),
    onSettled: () => void apiUtils.user.invalidate(),
  });

  function onSubmit(data: ProfileFormValues) {
    updateAccountMutation.mutate({
      image: data.image ?? "",
      name: data.name,
      username: data.username,
    });
  }

  const loading = updateAccountMutation.isPending;

  return (
    <ScrollArea className="h-full w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">
            Profile Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            This is how others will see you on the site.
          </p>
        </div>
      </div>
      <Separator className="mb-8" />

      <Form.Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="mx-auto max-w-4xl space-y-8 pb-16"
        >
          <Card className="p-6">
            <h3 className="mb-6 text-lg font-medium">Profile Picture</h3>
            <div className="flex justify-center">
              <AvatarImageFormField
                name="image"
                folder="shops"
                form={form}
                className="w-full"
                label="Profile Picture"
                description="Upload a profile picture. Recommended size 256x256px."
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
              <Form.FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <Form.FormItem>
                    <Form.FormLabel>Username</Form.FormLabel>
                    <Form.FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. johndoe"
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />

              <Form.FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Form.FormItem>
                    <Form.FormLabel>Your Name</Form.FormLabel>
                    <Form.FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. Jane"
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
            <Button disabled={loading} type="submit">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form.Form>
    </ScrollArea>
  );
}
