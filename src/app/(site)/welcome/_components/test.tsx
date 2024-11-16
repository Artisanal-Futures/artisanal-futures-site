// "use client";
// import { zodResolver } from "@hookform/resolvers/zod";

// import { useForm } from "react-hook-form";
// import { type z } from "zod";

// import { Form } from "~/components/ui/form";

// import { LoadButton } from "~/components/common/load-button";

// import { CONTACT_US_HEADINGS, COUNTRIES } from "~/data/user-constants";

// import { InputFormField } from "~/components/common/input-form-field";
// import { SelectFormField } from "~/components/common/select-form-field";
// import { TextareaFormField } from "~/components/common/textarea-form-field";
// import { ContactUsSchema } from "~/schemas/frontend";
// import { api } from "~/trpc/react";

// import { toastService } from "~/lib/notification";

// /**
//  * ContactUsForm component renders a form for users to contact us.
//  * It includes fields for heading, email, country, and message.
//  * The form uses react-hook-form for form state management and validation with zod.
//  * On successful submission, an email is sent and a success message is displayed.
//  */
// export function ContactUsForm() {
//   const form = useForm<z.infer<typeof ContactUsSchema>>({
//     resolver: zodResolver(ContactUsSchema),
//     defaultValues: {
//       heading: undefined,
//       email: "",
//       country: undefined,
//       message: "",
//     },
//   });

//   const sendEmail = api.email.contactUs.useMutation({
//     onSuccess: ({ message }) => {
//       toastService.success({ message });
//       form.reset();
//     },
//     onError: (error) => toastService.error({ message: error.message, error }),
//   });

//   const onSubmit = (data: z.infer<typeof ContactUsSchema>) =>
//     sendEmail.mutate(data);

//   return (
//     <Form {...form}>
//       <form
//         onSubmit={form.handleSubmit(onSubmit)}
//         className="mt-8 w-full space-y-6"
//       >
//         <SelectFormField
//           form={form}
//           name="heading"
//           label="Heading"
//           placeholder="Select message heading"
//           values={CONTACT_US_HEADINGS}
//         />
//         <InputFormField form={form} name="email" label="Email" />
//         <SelectFormField
//           form={form}
//           name="country"
//           label="Country"
//           placeholder="Select country"
//           values={COUNTRIES}
//         />
//         <TextareaFormField
//           form={form}
//           label="Message"
//           name="message"
//           placeholder="Hey, my name is ..."
//         />
//         <LoadButton
//           type="submit"
//           className="w-full bg-teal-500 hover:bg-teal-600 focus:bg-teal-600"
//           isLoading={sendEmail.isPending}
//           loadingText="Sending..."
//         >
//           Submit
//         </LoadButton>
//       </form>
//     </Form>
//   );
// }
