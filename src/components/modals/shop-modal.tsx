"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "~/trpc/react";
import { useShopModal } from "~/hooks/use-shop-modal";
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
import { Modal } from "~/components/ui/modal";

const formSchema = z.object({
  name: z.string().min(1),
});

export const ShopModal = () => {
  const ShopModal = useShopModal();

  const { data: sessionData } = useSession();

  const { mutate } = api.shop.create.useMutation({
    onSuccess: ({ data }) => {
      if (sessionData?.user?.role !== "ADMIN") {
        updateRole({ role: "ARTISAN" });
      }
      window.location.assign(`/profile/shop/${data.id}`);
      setLoading(false);
    },
    onError: (error) => {
      toastService.error("Something went wrong with creating your shop.");
      console.error(error);
      setLoading(false);
    },
    onMutate: () => {
      setLoading(true);
    },
  });

  const { mutate: updateRole } = api.auth.changeRole.useMutation({
    onSuccess: () => {
      toastService.success("Role updated.");
    },
    onError: (error) => {
      toastService.error("Something went wrong with updating your role.");
      console.error(error);
    },
  });

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values);
  };

  return (
    <Modal
      title="Create shop"
      description="Add a new shop to manage products and categories."
      isOpen={ShopModal.isOpen}
      onClose={ShopModal.onClose}
    >
      <div>
        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Form {...form}>
              <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder="E-Commerce"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex w-full items-center justify-end space-x-2 pt-6">
                  <Button
                    disabled={loading}
                    variant="outline"
                    type="button"
                    onClick={ShopModal.onClose}
                  >
                    Cancel
                  </Button>{" "}
                  <Button disabled={loading} type="submit">
                    Continue
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </Modal>
  );
};
