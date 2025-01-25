"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import type { Survey } from "@prisma/client";
import { toastService } from "@dreamwalker-studios/toasts";
import { zodResolver } from "@hookform/resolvers/zod";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { EditSection } from "~/components/sections/edit-section.admin";

import { AdminFormBody } from "./admin-form-body";
import { AdminFormHeader } from "./admin-form-header";

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

interface SettingsFormProps {
  initialData: Survey | null;

  successCallback?: () => void;
}

export const OnboardingSurveyForm: React.FC<SettingsFormProps> = ({
  initialData,
  successCallback,
}) => {
  const { data: shop } = api.shop.getCurrentUserShop.useQuery();
  const apiContext = api.useContext();
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

  const { mutate: updateSurvey } = api.survey.update.useMutation({
    onSuccess: () => {
      toastService.success({ message: "Survey updated." });
      successCallback!();
    },
    onError: (error) =>
      toastService.error({ message: "Something went wrong", error }),
    onMutate: () => setLoading(true),
    onSettled: () => {
      setLoading(false);
      void apiContext.survey.invalidate();
    },
  });

  const { mutate: createSurvey } = api.survey.create.useMutation({
    onSuccess: () => {
      toastService.success({ message: "Survey Created." });
      successCallback!();
    },
    onError: (error) =>
      toastService.error({ message: "Something went wrong", error }),
    onMutate: () => setLoading(true),
    onSettled: () => {
      setLoading(false);
      void apiContext.survey.invalidate();
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    if (!initialData) {
      createSurvey({
        ...data,
        shopId: shop?.id ?? "",
      });
    } else {
      updateSurvey({
        ...data,
        surveyId: initialData.id,
      });
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="w-full space-y-8"
        >
          <AdminFormHeader
            title={"Diving deeper into your business"}
            description={
              "Now that you have set up your shop, let's dive deeper into your business. Answer the following questions to the best of your abilities. This helps us better understand your business and how we can improve the platform."
            }
            contentName="Products"
            link={`/onboarding`}
          >
            <Button className="ml-auto" type="submit">
              Save and Continue
            </Button>
          </AdminFormHeader>
          <AdminFormBody className="mx-auto max-w-7xl flex-col space-y-0">
            <EditSection
              title="Business Questions"
              description="Be as descriptive as you can!"
              bodyClassName="gap-8 max-lg:space-y-8 md:grid md:grid-cols-3"
            >
              {" "}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Tell us about you and your business.</FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. Hey, my name is..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This is different from what you have put on the shop page:
                      the more you can say, the better! Pretend its an interview
                      -- what can you say that gives folks a deeper
                      understanding? Start with the basics about your products
                      or services. What makes them special? Cultural roots,
                      healthy growing, precision engineering, feminist
                      practices? Your relations to the community or customers?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />{" "}
              <FormField
                control={form.control}
                name="processes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>
                      What are some of your business processes?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. textiles, bead making"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Some examples of processes could be: textiles,
                      woodworking, metalworking, digital fabrication, print
                      media, heating/cooling, solar, farming/growing, and more!
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />{" "}
              <FormField
                control={form.control}
                name="materials"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>
                      What are some materials that go into your business?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. satin, silk, cotton, wool"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Some examples of processes could be: cotton, yarn, glass,
                      dyes, inks, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />{" "}
              <FormField
                control={form.control}
                name="principles"
                render={({ field }) => (
                  <FormItem className="col-span-full max-md:pb-8">
                    <FormLabel>
                      What are some principles when running your business?
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. black owned, sustainability, LGBTQ+ / Gender neutral"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Some examples of principles could be: black owned, female
                      owned, community education, african american civil rights,
                      LGBTQ/Gender neutral, Carbon neutral/sustainability and
                      environmental friendliness, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </EditSection>
            <EditSection
              title="Upcoming Form Features"
              description="We want to know what you are interested in. These questions help us on what to work on next!"
              bodyClassName="gap-8 max-lg:space-y-8 md:grid md:grid-cols-3"
            >
              <FormField
                control={form.control}
                name="unmoderatedForm"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Unmoderated Form</FormLabel>
                      <FormDescription>
                        This marks that you are interested in unmoderated forms
                        w/ the community.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="moderatedForm"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Moderated Form</FormLabel>
                      <FormDescription>
                        This marks that you are interested in moderated forms w/
                        the community.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hiddenForm"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Hidden Form</FormLabel>
                      <FormDescription>
                        This marks that you are interested in hidden forms w/
                        the community.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="privateForm"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Private Form</FormLabel>
                      <FormDescription>
                        This marks that you are interested in private forms w/
                        the community.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplyChain"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Supply Chain</FormLabel>
                      <FormDescription>
                        This marks that you are interested in becoming part of
                        the artisan supply chain.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />{" "}
              <FormField
                control={form.control}
                name="messagingOptIn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Opt In to Text Messages?</FormLabel>
                      <FormDescription>
                        This marks that you are opting in to the messaging
                        service aspect of our routing app and will receive text
                        messages from us.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </EditSection>
          </AdminFormBody>
          {/* <Button disabled={loading} className="ml-auto" type="submit">
            Save and continue
          </Button> */}
        </form>
      </Form>
    </>
  );
};
