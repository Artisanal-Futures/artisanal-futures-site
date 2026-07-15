import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adminOnboardingSchema,
  artisanOnboardingSchema,
  guestOnboardingSchema,
} from "~/lib/validators/onboarding";
import {
  adminOnlyProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

function isValidArtisanCode(
  invite: { role: string; used: boolean; expiresAt: Date } | null,
) {
  return (
    invite?.role === "ARTISAN" && !invite.used && invite.expiresAt > new Date()
  );
}

function isValidAdminCode(
  invite: { role: string; used: boolean; expiresAt: Date } | null,
) {
  return (
    invite?.role === "ADMIN" && !invite.used && invite.expiresAt > new Date()
  );
}

function isValidGuestCode(
  invite: { role: string; used: boolean; expiresAt: Date } | null,
) {
  return (
    invite?.role === "GUEST" && !invite.used && invite.expiresAt > new Date()
  );
}

export const onboardingRouter = createTRPCRouter({
  onboardArtisan: protectedProcedure
    .input(artisanOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const code = input.invitationCode.trim().toUpperCase();
      const invite = await ctx.db.platformInvite.findUnique({
        where: { code },
      });

      if (!isValidArtisanCode(invite)) {
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
            businessType: input.businessType ?? "",
            productCategories: input.productCategories ?? [],
            principles: input.principles ?? [],
            processes: input.commonProcesses ?? [],
            materials: input.materialsUsed ?? [],
          },
        });

        // 3. Mark platform invite as used if applicable
        if (invite) {
          await tx.platformInvite.update({
            where: { id: invite.id },
            data: {
              used: true,
              usedAt: new Date(),
              usedBy: ctx.session.user.id,
            },
          });
        }

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
      const code = input.invitationCode.trim().toUpperCase();
      const invite = await ctx.db.platformInvite.findUnique({
        where: { code },
      });

      if (!isValidGuestCode(invite)) {
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

      if (invite) {
        await ctx.db.platformInvite.update({
          where: { id: invite.id },
          data: {
            used: true,
            usedAt: new Date(),
            usedBy: ctx.session.user.id,
          },
        });
      }

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

  onboardAdmin: protectedProcedure
    .input(adminOnboardingSchema)
    .mutation(async ({ ctx, input }) => {
      const code = input.invitationCode.trim().toUpperCase();
      const invite = await ctx.db.platformInvite.findUnique({
        where: { code },
      });

      if (!isValidAdminCode(invite)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid invitation code",
        });
      }

      await ctx.db.platformInvite.update({
        where: { id: invite!.id },
        data: {
          used: true,
          usedAt: new Date(),
          usedBy: ctx.session.user.id,
        },
      });

      return {
        message: "Welcome to the platform!",
        redirectUrl: "/auth/join/admin/welcome",
      };
    }),

  getGuestSurveys: adminOnlyProcedure.query(async ({ ctx }) => {
    const guests = await ctx.db.guestSurvey.findMany();
    return guests;
  }),
  getArtisanSurveys: adminOnlyProcedure.query(async ({ ctx }) => {
    const artisans = await ctx.db.artisanSurvey.findMany();
    return artisans;
  }),
  deleteGuestSurveys: adminOnlyProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.guestSurvey.deleteMany({
        where: { id: { in: input } },
      });
      return { message: `${input.length} guest survey(s) deleted successfully` };
    }),
});
