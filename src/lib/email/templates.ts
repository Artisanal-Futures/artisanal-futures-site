/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import ContactFormEmail from "~/emails/contact-form";

import { EMAIL_FROM, sendEmail } from "./send";

// Contact Form Submission (to owner)
export async function sendContactFormSubmission(params: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
  preferredContactMethod?: "email" | "phone" | "no-preference";
  business: {
    name: string;
    ownerEmail: string;
  };
}) {
  return sendEmail({
    from: EMAIL_FROM.NOREPLY,
    fromName: params.business.name,
    to: params.business.ownerEmail,
    replyTo: params.email,
    subject:
      params.subject ?? `New Contact Form Submission from ${params.name}`,
    react: ContactFormEmail({
      name: params.name,
      email: params.email,
      subject: params.subject,
      message: params.message,
      businessName: params.business.name,
    }),
    tags: [{ name: "category", value: "contact_form" }],
  });
}
