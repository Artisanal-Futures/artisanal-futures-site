"use client";

import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import type { GuestOnboardingFormSchemaType } from "../_validators/schema";
import { api } from "~/trpc/react";
import { useDefaultMutationActions } from "~/hooks/use-default-mutation-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Form } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { AbsolutePageLoader } from "~/components/absolute-page-loader";
import { LoadButton } from "~/components/common/load-button";
import { InputFormField } from "~/components/inputs/input-form-field";

import { guestOnboardingFormSchema } from "../_validators/schema";

export default function GuestArtisanRegistrationForm() {
  const sessionData = useSession();

  const { defaultActions } = useDefaultMutationActions({
    entity: "guest",
  });

  const { data: isCompleted, isPending } = api.guest.isCompleted.useQuery();

  const form = useForm<GuestOnboardingFormSchemaType>({
    resolver: zodResolver(guestOnboardingFormSchema),
    defaultValues: {
      name: "",
      country: "",
      state: "",
      artisanalPractice: "",
      otherPractice: "",
      email: sessionData.data?.user?.email ?? "",
    },
  });

  const guestRegistrationMutation =
    api.guest.create.useMutation(defaultActions);

  const handleSubmit = (data: GuestOnboardingFormSchemaType) =>
    guestRegistrationMutation.mutate(data);

  if (isPending) return <AbsolutePageLoader />;

  if (isCompleted) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Thank You!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Thanks for completing the survey. Make sure to check your email for
            more details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Guest Registration</CardTitle>
        <CardDescription>
          Welcome! Please fill out the form below to register as a guest. You
          need to complete this form in order to get additional details about
          the webinar coming up.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={(e) => void form.handleSubmit(handleSubmit)(e)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <InputFormField
                form={form}
                name="name"
                label="Name"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <InputFormField
                form={form}
                name="country"
                label="Country"
                placeholder="Enter your country"
              />
            </div>

            <div className="space-y-2">
              <InputFormField
                form={form}
                name="state"
                label="State"
                placeholder="Enter your state"
              />
            </div>

            <div className="space-y-2">
              <Label>Artisanal Practices</Label>
              <RadioGroup
                onValueChange={(value) =>
                  form.setValue("artisanalPractice", value)
                }
                value={form.watch("artisanalPractice")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cloth" id="cloth" />
                  <Label htmlFor="cloth">Cloth designer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bag" id="bag" />
                  <Label htmlFor="bag">Bag Designer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Cloth and Bag Designer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Others</Label>
                </div>
              </RadioGroup>
            </div>

            {form.watch("artisanalPractice") === "other" && (
              <div className="space-y-2">
                <InputFormField
                  form={form}
                  name="otherPractice"
                  label="Other Practice"
                  placeholder="Enter your artisanal practice"
                />
              </div>
            )}

            <div className="space-y-2">
              <InputFormField
                form={form}
                name="email"
                label="Email"
                placeholder="Enter your email address"
                disabled={!!sessionData?.data?.user?.email}
              />
            </div>
          </CardContent>
          <CardFooter>
            <LoadButton
              type="submit"
              className="w-full"
              isLoading={guestRegistrationMutation.isPending}
            >
              Register
            </LoadButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
