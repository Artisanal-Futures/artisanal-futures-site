"use client";

import type { z } from "zod";
import { useForm } from "react-hook-form";

import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

import { profileFormSchema } from "../_validators/schema";
import { AvatarImageFormField } from "./avatar-image-form-field";

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
            className="space-y-6"
          >
            <div className="flex justify-center pb-6">
              <AvatarImageFormField
                name="image"
                folder="shops"
                form={form}
                className="w-full"
                label="Profile Picture"
                description="Upload a profile picture. Recommended size 256x256px."
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. johndoe"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Jane"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="min-w-[120px]"
                disabled={updateAccountMutation.isPending}
              >
                {updateAccountMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
