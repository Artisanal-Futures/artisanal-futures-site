// "use client";

// import { useMemo } from "react";
// import { useParams } from "next/navigation";

// import { attributeSchema } from "@dws/db/schema";
// import { type Attribute } from "@dws/db/types";
// import { cn } from "~/utils/styles";
// import { Form } from "~/components/ui/form";
// import { InputFormField } from "@dws/ui/inputs";

// import { LoadButton } from "~/components/buttons";
// import {
//   FormActionHeader,
//   FormAdditionalOptionsButton,
//   FormDiscardButton,
//   FormSection,
// } from "~/components/forms";
// import { useAdminForm } from "~/hooks/use-admin-form";
// import { useUnsavedChanges } from "~/hooks/use-unsaved-changes";
// import { useAttributeMutations } from "../_hooks/use-attribute-mutations";
// import { type AttributeFormValues } from "../_validators/types";
// import { AttributesNestedValueInput } from "./attributes-nested-value-input";

// type Props = { initialData: Attribute | null };

// export const AttributeForm: React.FC<Props> = ({ initialData }) => {
//   const params = useParams();
//   const { attributeId, storeId } = params as {
//     attributeId: string;
//     storeId: string;
//   };

//   const attributeMutations = useAttributeMutations();
//   const defaultValues = useMemo(
//     () => ({
//       name: initialData?.name ?? "",
//       values: initialData?.values.map((val) => ({ content: val })) ?? [
//         { content: "" },
//       ],
//     }),
//     [initialData],
//   );

//   const {
//     form,
//     formErrors,
//     isLoading,
//     onSubmit,
//     onDelete,
//     onSaveAndDuplicate,
//   } = useAdminForm<AttributeFormValues, typeof initialData>({
//     schema: attributeSchema,
//     defaultValues,
//     mutations: attributeMutations,
//     initialData,
//     entityId: attributeId,
//   });

//   const { hasUnsavedChanges } = useUnsavedChanges({ form, defaultValues });

//   return (
//     <>
//       <Form {...form}>
//         <form
//           onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
//           onKeyDown={(e) => {
//             if (e.key === "Enter") e.preventDefault();
//           }}
//         >
//           <FormActionHeader
//             title={`${initialData ? "Edit" : "Create"} Attribute`}
//             unsavedChanges={hasUnsavedChanges}
//             backURL={`/admin/${storeId}/attributes`}
//           >
//             <FormAdditionalOptionsButton
//               onDelete={onDelete}
//               onDuplicate={onSaveAndDuplicate}
//             />
//             <FormDiscardButton isLoading={isLoading} />
//             <LoadButton
//               type="submit"
//               isLoading={isLoading}
//               loadingText="Saving..."
//               size="sm"
//             >
//               {initialData ? "Save attribute" : "Create attribute"}
//             </LoadButton>
//           </FormActionHeader>

//           <section className="form-body max-w-2xl">
//             <div className={cn("flex w-full flex-col space-y-4")}>
//               <FormSection
//                 title="Details"
//                 description="Assign basic info about the attribute"
//                 headerClassName="xl:w-4/12"
//                 bodyClassName="space-y-8 xl:w-8/12 mt-0"
//                 className="flex flex-col justify-between gap-8 xl:flex-row"
//               >
//                 <InputFormField
//                   form={form}
//                   name="name"
//                   label="Name"
//                   disabled={isLoading}
//                   placeholder="e.g. Size"
//                   description="Tip: This represents a type of product, so make sure it
//                   has a name that fits"
//                 />
//               </FormSection>
//               <FormSection
//                 title="Values"
//                 description=" Add Attribute values to quickly make variants of your products. I.E. sizes, colors, materials, etc."
//                 headerClassName="xl:w-4/12"
//                 bodyClassName="space-y-8 xl:w-8/12 mt-0"
//                 className="flex flex-col justify-between gap-8 xl:flex-row"
//               >
//                 <div
//                   className={cn(
//                     "flex w-full flex-col items-start space-y-4 rounded-md border border-border p-4 shadow",
//                     formErrors?.values && "border-red-600",
//                   )}
//                   tabIndex={0}
//                 >
//                   <AttributesNestedValueInput
//                     {...{ control: form.control, form: form }}
//                   />
//                 </div>
//               </FormSection>
//             </div>
//           </section>
//         </form>
//       </Form>
//     </>
//   );
// };
