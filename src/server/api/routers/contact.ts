import { TRPCError } from "@trpc/server";

import { env } from "~/env";
import { verifyHCaptcha } from "~/lib/captcha/verify-hcaptcha";
import { sendContactFormSubmission } from "~/lib/email/templates";
import { contactSchema } from "~/lib/validators/contact";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const contactRouter = createTRPCRouter({
  send: publicProcedure.input(contactSchema).mutation(async ({ input }) => {
    const isValid = await verifyHCaptcha(input.captchaToken);
    if (!isValid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Captcha verification failed",
      });
    }

    const {
      name,
      email,
      subject,
      message,
      phone,
      preferredContactMethod,
      website,
    } = input;

    if (input.website && input.website.trim() !== "") {
      console.log("Bot detected");
      return {
        message: "Email sent successfully",
      };
    }

    const contactEmail = await sendContactFormSubmission({
      name,
      email,
      subject,
      message,
      phone,
      preferredContactMethod,
      business: {
        name: "Artisanal Futures",
        ownerEmail: env.NEXT_PUBLIC_EMAIL_FROM_SUPPORT,
      },
    });

    if (!contactEmail.success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send email",
      });
    }

    return { message: "Your message has been sent successfully" };
  }),
});
