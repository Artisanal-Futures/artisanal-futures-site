"use client";

import { useForm } from "react-hook-form";

import type { Shop, Survey } from "@prisma/client";
import { zodResolver } from "@hookform/resolvers/zod";

import type { surveyFormSchema, SurveyFormValues } from "../_validators/schema";
import { api } from "~/trpc/react";
import { useDefaultMutationActions } from "~/hooks/use-default-mutation-actions";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import * as Form from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";

type Props = {
  initialData: Survey | null;
  shop: Shop;
};

export const SurveyForm: React.FC<Props> = ({ initialData, shop }) => {
  const { defaultActions } = useDefaultMutationActions({
    entity: "survey",
  });

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      businessType: initialData?.businessType ?? "",
      experience: initialData?.experience ?? "",
      description: initialData?.description ?? "",
      processes: initialData?.processes ?? "",
      materials: initialData?.materials ?? "",
      principles: initialData?.principles ?? "",
    },
  });

  const createSurveyMutation = api.survey.create.useMutation(defaultActions);

  const updateSurveyMutation = api.survey.update.useMutation(defaultActions);

  const onSubmit = (data: SurveyFormValues) => {
    if (initialData)
      updateSurveyMutation.mutate({
        ...data,
        surveyId: initialData.id,
        ownerId: shop.ownerId,
        shopId: shop?.id,
      });
    else
      createSurveyMutation.mutate({
        ...data,
        shopId: shop?.id,
        ownerId: shop.ownerId,
      });
  };

  const loading =
    createSurveyMutation.isPending || updateSurveyMutation.isPending;

  return (
    <ScrollArea className="h-full w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">
            {initialData?.id ? "Update Survey" : "New Survey"}{" "}
            {shop ? `for ${shop.name ?? "your shop"}` : ""}
          </h2>
          <p className="text-sm text-muted-foreground">
            Let us know more about your business and preferences
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
            <h3 className="mb-6 text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <Form.FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <Form.FormItem className="sm:col-span-3">
                    <Form.FormLabel>
                      What type of business do you run?
                    </Form.FormLabel>
                    <Form.FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. Retail store, Service provider..."
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />

              <Form.FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <Form.FormItem className="sm:col-span-3">
                    <Form.FormLabel>
                      How long have you been in business?
                    </Form.FormLabel>
                    <Form.FormControl>
                      <Input
                        disabled={loading}
                        placeholder="e.g. 5 years in retail..."
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 text-lg font-medium">Business Details</h3>
            <div className="space-y-6">
              <Form.FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Form.FormItem>
                    <Form.FormLabel>
                      Tell us about you and your business
                    </Form.FormLabel>
                    <Form.FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. Hey, my name is..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </Form.FormControl>
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
              />

              <Form.FormField
                control={form.control}
                name="processes"
                render={({ field }) => (
                  <Form.FormItem>
                    <Form.FormLabel>
                      What are some of your business processes?
                    </Form.FormLabel>
                    <Form.FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. textiles, bead making"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormDescription>
                      Some examples of processes could be: textiles,
                      woodworking, metalworking, digital fabrication, print
                      media, heating/cooling, solar, farming/growing, and more!
                    </Form.FormDescription>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />

              <Form.FormField
                control={form.control}
                name="materials"
                render={({ field }) => (
                  <Form.FormItem>
                    <Form.FormLabel>
                      What are some materials that go into your business?
                    </Form.FormLabel>
                    <Form.FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. satin, silk, cotton, wool"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormDescription>
                      Some examples of processes could be: cotton, yarn, glass,
                      dyes, inks, etc.
                    </Form.FormDescription>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />

              <Form.FormField
                control={form.control}
                name="principles"
                render={({ field }) => (
                  <Form.FormItem>
                    <Form.FormLabel>
                      What are some principles when running your business?
                    </Form.FormLabel>
                    <Form.FormControl>
                      <Textarea
                        disabled={loading}
                        placeholder="e.g. black owned, sustainability, LGBTQ+ / Gender neutral"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </Form.FormControl>
                    <Form.FormDescription>
                      Some examples of principles could be: black owned, female
                      owned, community education, african american civil rights,
                      LGBTQ/Gender neutral, Carbon neutral/sustainability and
                      environmental friendliness, etc.
                    </Form.FormDescription>
                    <Form.FormMessage />
                  </Form.FormItem>
                )}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button disabled={loading} type="submit">
              Save changes
            </Button>
          </div>
        </form>
      </Form.Form>
    </ScrollArea>
  );
};
