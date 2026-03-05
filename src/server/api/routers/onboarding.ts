import { TRPCError } from "@trpc/server";

import {
  artisanOnboardingSchema,
  guestOnboardingSchema,
} from "~/lib/validators/onboarding";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const onboardingRouter = createTRPCRouter({
  onboardArtisan: protectedProcedure
    .input(artisanOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const code = input.invitationCode;
      const validCode = process.env.ARTISAN_CODE;

      if (code !== validCode) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid invitation code",
        });
      }

      const business = await ctx.db.$transaction(async (tx) => {
        // 1. Create business
        const newShop = await tx.shop.create({
          data: {
            ownerName: input.ownerName,
            bio: input.ownerBio ?? "",
            description: input.publicDescription ?? "",
            logoPhoto: input.logoPhotoUrl ?? "",
            ownerPhoto: input.ownerPhotoUrl ?? "",
            website: input.websiteLink ?? "",
            attributeTags: input.principles ?? [],
            email: input.businessEmail ?? "",
            phone: input.businessTelephone ?? "",
            name: input.businessName,
            ownerId: ctx.session.user.id,
          },
        });

        // 2. Create shop survey
        const newArtisanSurvey = await tx.artisanSurvey.create({
          data: {
            userId: ctx.session.user.id,
            name: input.ownerName,
            businessName: input.businessName,
            businessInterview: input.businessInterview,
            businessLocation: input.businessLocation ?? "",
            businessEmail: input.businessEmail ?? "",
            businessPhone: input.businessTelephone ?? "",
            businessWebsite: input.websiteLink ?? "",
            businessType: input.businessType.join(","),
            productCategories: input.productCategories ?? [],
            principles: input.principles ?? [],
            processes: input.commonProcesses ?? [],
            materials: input.materialsUsed ?? [],
          },
        });

        return { newShop, newArtisanSurvey };
      });

      // await emailService.sendEmail({
      //   from: emailEnv.NO_RESPOND_EMAIL,
      //   to: ctx.session.user.email ?? "",
      //   subject: "Welcome to Artisanal Futures",
      //   template: WelcomeGuestEmail,
      //   data: {
      //     name: input.name,
      //     webinarLink: "https://wpi.zoom.us/j/99084453348",
      //   },
      // });

      return {
        data: business,
        message: "Welcome to the platform!",
        redirectUrl: "/admin/welcome",
      };
    }),

  onboardGuest: protectedProcedure
    .input(guestOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const code = input.invitationCode;
      const validCode = process.env.GUEST_CODE;

      if (code !== validCode) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid invitation code",
        });
      }
      const guest = await ctx.db.guestSurvey.create({
        data: {
          name: input.name,
          country: input.country,
          state: input.state,
          artisanalPractice: input.artisanalPractice,
          otherPractice: input.otherPractice,
          email: ctx.session.user.email ?? "",
          userId: ctx.session.user.id,
        },
      });

      // await emailService.sendEmail({
      //   from: emailEnv.NO_RESPOND_EMAIL,
      //   to: ctx.session.user.email ?? "",
      //   subject: "Welcome to Artisanal Futures",
      //   template: WelcomeGuestEmail,
      //   data: {
      //     name: input.name,
      //     webinarLink: "https://wpi.zoom.us/j/99084453348",
      //   },
      // });

      return {
        data: guest,
        message: "Welcome to the platform!",
        redirectUrl: "/join/guest/welcome",
      };
    }),
});
