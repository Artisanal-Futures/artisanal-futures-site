"use client";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import type { SurveyFormSchema } from "../_validators/schema";
import type { Survey } from "~/types/survey";
import { api } from "~/trpc/react";
import { useDefaultMutationActions } from "~/hooks/use-default-mutation-actions";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { ScrollArea } from "~/components/ui/scroll-area";
import { LoadButton } from "~/components/common/load-button";
import { FancySwitchFormField } from "~/components/inputs";
import { InputFormField } from "~/components/inputs/input-form-field";
import { SelectFormField } from "~/components/inputs/select-form-field";
import { TextareaFormField } from "~/components/inputs/textarea-form-field";

import { surveyFormSchema } from "../_validators/schema";

type Props = {
  initialData: Survey | null;
  onSuccessCallback: () => void;
};

export function SurveyForm({ initialData, onSuccessCallback }: Props) {
  const { defaultSuccess, defaultError, defaultSettled } =
    useDefaultMutationActions({
      entity: "survey",
    });

  const { data: shops } = api.shop.getAll.useQuery();
  const { data: users } = api.user.getAll.useQuery();

  const form = useForm<SurveyFormSchema>({
    resolver: zodResolver(surveyFormSchema),
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
      messagingOptIn: initialData?.messagingOptIn ?? false,
      shopId: initialData?.shopId ?? "",
      ownerId: initialData?.ownerId ?? "",
    },
  });

  const updateSurvey = api.survey.update.useMutation({
    onSuccess: ({ message }) => {
      defaultSuccess({ message });
      onSuccessCallback();
    },
    onError: defaultError,
    onSettled: defaultSettled,
  });

  const createSurvey = api.survey.create.useMutation({
    onSuccess: ({ message }) => {
      defaultSuccess({ message });
      onSuccessCallback();
    },
    onError: defaultError,
    onSettled: defaultSettled,
  });

  async function onSubmit(data: SurveyFormSchema) {
    if (!initialData) {
      createSurvey.mutate(data);
    } else {
      updateSurvey.mutate({
        surveyId: initialData.id,
        ...data,
      });
    }
  }

  const isLoading = updateSurvey.isPending || createSurvey.isPending;

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        className="h-full space-y-8"
      >
        <ScrollArea className="h-[60svh]" type="always">
          <div className="grid grid-cols-2 gap-4 p-1">
            {/* Basic Info Section */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-medium text-primary">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <SelectFormField
                  form={form}
                  name="shopId"
                  label="Shop"
                  values={
                    shops?.map((shop) => ({
                      label: shop.name,
                      value: shop.id,
                    })) ?? []
                  }
                  className="w-full"
                />
                <SelectFormField
                  form={form}
                  name="ownerId"
                  label="Owner"
                  values={
                    users?.map((user) => ({
                      label: user.name ?? user.email,
                      value: user.id,
                    })) ?? []
                  }
                  className="w-full"
                />
                <InputFormField
                  form={form}
                  name="processes"
                  label="Processes"
                  className="w-full"
                />
                <InputFormField
                  form={form}
                  name="materials"
                  label="Materials"
                  className="w-full"
                />
                <InputFormField
                  form={form}
                  name="principles"
                  label="Principles"
                  className="w-full"
                />
                <TextareaFormField
                  form={form}
                  name="description"
                  label="Description"
                  className="w-full"
                />
              </div>
            </div>

            {/* Form Settings Section */}
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-medium text-primary">
                Form Settings
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <FancySwitchFormField
                  form={form}
                  name="unmoderatedForm"
                  label="Unmoderated Form"
                />
                <FancySwitchFormField
                  form={form}
                  name="moderatedForm"
                  label="Moderated Form"
                />
                <FancySwitchFormField
                  form={form}
                  name="hiddenForm"
                  label="Hidden Form"
                />
                <FancySwitchFormField
                  form={form}
                  name="privateForm"
                  label="Private Form"
                />
                <FancySwitchFormField
                  form={form}
                  name="supplyChain"
                  label="Supply Chain"
                />
                <FancySwitchFormField
                  form={form}
                  name="messagingOptIn"
                  label="Messaging Opt-in"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="mt-8 flex justify-end gap-2">
          <Button variant="outline" onClick={onSuccessCallback} type="button">
            Cancel
          </Button>
          <LoadButton isLoading={isLoading} loadingText="Saving survey...">
            {initialData ? "Update survey" : "Create survey"}
          </LoadButton>
        </div>
      </form>
    </Form>
  );
}
