"use client";

import { useState } from "react";
import { useRouter as useNavigationRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

import type { Shop, Survey } from "@prisma/client";
import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "~/trpc/react";
import { useModal } from "~/hooks/use-modal";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import * as Form from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { DeleteItem } from "~/components/delete-item";

const formSchema = z.object({
  processes: z.string().optional(),
  materials: z.string().optional(),
  principles: z.string().optional(),
  description: z.string().optional(),
  unmoderatedForm: z.boolean().default(false),
  moderatedForm: z.boolean().default(false),
  hiddenForm: z.boolean().default(false),
  privateForm: z.boolean().default(false),
  supplyChain: z.boolean().default(false),
  messagingOptIn: z.boolean().default(false),
});

type SettingsFormValues = z.infer<typeof formSchema>;

type TSurveyFormProps = {
  initialData: Survey | null;
  shop: Shop;
};

export const SurveyForm: React.FC<TSurveyFormProps> = ({
  initialData,
  shop,
}) => {
  const alertModal = useModal((state) => state);

  const apiContext = api.useUtils();
  const router = useNavigationRouter();

  const [loading, setLoading] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      processes: initialData?.processes ?? "",
      materials: initialData?.materials ?? "",
      principles: initialData?.principles ?? "",
      description: initialData?.description ?? "",
      unmoderatedForm: initialData?.unmoderatedForm ?? false,
      moderatedForm: initialData?.moderatedForm ?? false,
      hiddenForm: initialData?.hiddenForm ?? false,
      privateForm: initialData?.privateForm ?? false,
      supplyChain: initialData?.supplyChain ?? false,
    },
  });

  const { mutate: createSurvey } = api.survey.create.useMutation({
    onSuccess: () => toastService.success({ message: "Survey created." }),
    onError: (error) =>
      toastService.error({ message: "Something went wrong", error }),
    onMutate: () => setLoading(true),
    onSettled: () => {
      setLoading(false);
      void apiContext.survey.getCurrentUserShopSurvey.invalidate();
    },
  });

  const { mutate: updateSurvey } = api.survey.update.useMutation({
    onSuccess: () => toastService.success({ message: "Shop updated." }),
    onError: (error) =>
      toastService.error({ message: "Something went wrong", error }),
    onMutate: () => setLoading(true),
    onSettled: () => {
      setLoading(false);
      void apiContext.survey.getCurrentUserShopSurvey.invalidate();
    },
  });

  const { mutate: deleteSurvey } = api.survey.delete.useMutation({
    onSuccess: () => {
      router.push("/profile");
      toastService.success({ message: "Shop deleted." });
    },
    onError: (error) =>
      toastService.error({
        message:
          "There was an error deleting the survey. Please try again later.",
        error,
      }),
    onMutate: () => setLoading(true),
    onSettled: () => {
      setLoading(false);
      alertModal.onClose();
      void apiContext.survey.getCurrentUserShopSurvey.invalidate();
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    if (initialData)
      updateSurvey({
        ...data,
        surveyId: initialData.id,
      });
    else
      createSurvey({
        ...data,
        shopId: shop?.id,
      });
  };

  const onDelete = () => {
    if (initialData)
      deleteSurvey({
        surveyId: initialData?.id,
      });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            Survey Dashboard:{" "}
            <span>
              {initialData?.id ? "Update Survey" : "New Survey"}{" "}
              {shop ? `for ${shop.shopName ?? "your shop"}` : ""}{" "}
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Let us know more about your business and preferences
          </p>
        </div>

        {initialData && (
          <DeleteItem
            isDisabled={loading}
            confirmCallback={onDelete}
            {...alertModal}
          />
        )}
      </div>
      <Separator />
      <Form.Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="w-full space-y-8"
        >
          <div className="gap-8 md:grid md:grid-cols-3">
            {" "}
            <Form.FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.FormItem className="sm:col-span-3">
                  <Form.FormLabel>
                    Tell us about you and your business
                  </Form.FormLabel>
                  <Form.FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder="e.g. Hey, my name is..."
                      {...field}
                    />
                  </Form.FormControl>{" "}
                  <Form.FormDescription>
                    Tell us about your business: the more you can say, the
                    better! Pretend its an interview -- what can you say that
                    gives folks a deeper understanding? Start with the basics
                    about your products or services. What makes them special?
                    Cultural roots, healthy growing, precision engineering,
                    feminist practices? Your relations to the community or
                    customers?
                  </Form.FormDescription>
                  <Form.FormMessage />
                </Form.FormItem>
              )}
            />{" "}
            <Form.FormField
              control={form.control}
              name="processes"
              render={({ field }) => (
                <Form.FormItem className="sm:col-span-3">
                  <Form.FormLabel>
                    What are some of your business processes?
                  </Form.FormLabel>
                  <Form.FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder="e.g. textiles, bead making"
                      {...field}
                    />
                  </Form.FormControl>{" "}
                  <Form.FormDescription>
                    Some examples of processes could be: textiles, woodworking,
                    metalworking, digital fabrication, print media,
                    heating/cooling, solar, farming/growing, and more!
                  </Form.FormDescription>
                  <Form.FormMessage />
                </Form.FormItem>
              )}
            />{" "}
            <Form.FormField
              control={form.control}
              name="materials"
              render={({ field }) => (
                <Form.FormItem className="sm:col-span-3">
                  <Form.FormLabel>
                    What are some materials that go into your business?
                  </Form.FormLabel>
                  <Form.FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder="e.g. satin, silk, cotton, wool"
                      {...field}
                    />
                  </Form.FormControl>{" "}
                  <Form.FormDescription>
                    Some examples of processes could be: cotton, yarn, glass,
                    dyes, inks, etc.
                  </Form.FormDescription>
                  <Form.FormMessage />
                </Form.FormItem>
              )}
            />{" "}
            <Form.FormField
              control={form.control}
              name="principles"
              render={({ field }) => (
                <Form.FormItem className="col-span-full">
                  <Form.FormLabel>
                    What are some principles when running your business?
                  </Form.FormLabel>
                  <Form.FormControl>
                    <Textarea
                      disabled={loading}
                      placeholder="e.g. black owned, sustainability, LGBTQ+ / Gender neutral"
                      {...field}
                    />
                  </Form.FormControl>{" "}
                  <Form.FormDescription>
                    Some examples of principles could be: black owned, female
                    owned, community education, african american civil rights,
                    LGBTQ/Gender neutral, Carbon neutral/sustainability and
                    environmental friendliness, etc.
                  </Form.FormDescription>
                  <Form.FormMessage />
                </Form.FormItem>
              )}
            />{" "}
            <Form.FormField
              control={form.control}
              name="unmoderatedForm"
              render={({ field }) => (
                <Form.FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Form.FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Form.FormControl>
                  <div className="space-y-1 leading-none">
                    <Form.FormLabel>Unmoderated Form</Form.FormLabel>
                    <Form.FormDescription>
                      This marks that you are interested in unmoderated forms w/
                      the community.
                    </Form.FormDescription>
                  </div>
                </Form.FormItem>
              )}
            />
            <Form.FormField
              control={form.control}
              name="moderatedForm"
              render={({ field }) => (
                <Form.FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Form.FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Form.FormControl>
                  <div className="space-y-1 leading-none">
                    <Form.FormLabel>Moderated Form</Form.FormLabel>
                    <Form.FormDescription>
                      This marks that you are interested in moderated forms w/
                      the community.
                    </Form.FormDescription>
                  </div>
                </Form.FormItem>
              )}
            />
            <Form.FormField
              control={form.control}
              name="hiddenForm"
              render={({ field }) => (
                <Form.FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Form.FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Form.FormControl>
                  <div className="space-y-1 leading-none">
                    <Form.FormLabel>Hidden Form</Form.FormLabel>
                    <Form.FormDescription>
                      This marks that you are interested in hidden forms w/ the
                      community.
                    </Form.FormDescription>
                  </div>
                </Form.FormItem>
              )}
            />
            <Form.FormField
              control={form.control}
              name="privateForm"
              render={({ field }) => (
                <Form.FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Form.FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Form.FormControl>
                  <div className="space-y-1 leading-none">
                    <Form.FormLabel>Private Form</Form.FormLabel>
                    <Form.FormDescription>
                      This marks that you are interested in private forms w/ the
                      community.
                    </Form.FormDescription>
                  </div>
                </Form.FormItem>
              )}
            />
            <Form.FormField
              control={form.control}
              name="supplyChain"
              render={({ field }) => (
                <Form.FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Form.FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Form.FormControl>
                  <div className="space-y-1 leading-none">
                    <Form.FormLabel>Supply Chain</Form.FormLabel>
                    <Form.FormDescription>
                      This marks that you are interested in becoming part of the
                      artisan supply chain.
                    </Form.FormDescription>
                  </div>
                </Form.FormItem>
              )}
            />{" "}
            <Form.FormField
              control={form.control}
              name="messagingOptIn"
              render={({ field }) => (
                <Form.FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Form.FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Form.FormControl>
                  <div className="space-y-1 leading-none">
                    <Form.FormLabel>Opt In to Text Messages</Form.FormLabel>
                    <Form.FormDescription>
                      This marks that you are opting in to the messaging service
                      aspect of our routing app and will receive text messages
                      from us.
                    </Form.FormDescription>
                  </div>
                </Form.FormItem>
              )}
            />
          </div>
          <Button disabled={loading} className="ml-auto" type="submit">
            Save changes
          </Button>
        </form>
      </Form.Form>
    </>
  );
};
