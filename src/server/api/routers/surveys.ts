import {
  createTRPCRouter,
  elevatedProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import { surveySchema } from "~/lib/validators/survey";

export const surveysRouter = createTRPCRouter({
  getAll: elevatedProcedure.query(async ({ ctx }) => {
    const surveys = await ctx.db.survey.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (ctx.session.user.role !== "ADMIN") {
      return surveys.filter((survey) => survey.ownerId === ctx.session.user.id);
    }

    return surveys;
  }),

  get: protectedProcedure
    .input(z.object({ surveyId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.survey.findUnique({
        where: {
          id: input.surveyId,
          ownerId: ctx.session.user.id,
        },
      });
    }),
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const survey = await ctx.db.survey.findFirst({
      where: { ownerId: ctx.session.user.id },
    });
    const shop = await ctx.db.shop.findFirst({
      where: { OR: [{ ownerId: ctx.session.user.id }, { id: survey?.shopId }] },
      include: { owner: true },
    });

    return {
      survey,
      shop,
    };
  }),

  getCurrentUserShopSurvey: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.survey.findFirst({
        where: {
          ownerId: ctx.session.user.id,
          shopId: input.shopId,
        },
      });
    }),
  create: elevatedProcedure
    .input(surveySchema)
    .mutation(async ({ ctx, input }) => {
      const survey = await ctx.db.survey.create({
        data: {
          shopId: input.shopId,
          ownerId: ctx.session.user.id,
          processes: input.processes,
          materials: input.materials,
          principles: input.principles,
          description: input.description,
        },
      });

      return {
        data: survey,
        message: "Survey created successfully",
      };
    }),

  update: elevatedProcedure
    .input(
      surveySchema.extend({
        surveyId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const survey = await ctx.db.survey.findFirst({
        where: { id: input.surveyId },
      });

      if (!survey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey not found",
        });
      }

      if (
        survey.ownerId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update this survey",
        });
      }

      const updatedSurvey = await ctx.db.survey.update({
        where: {
          id: input.surveyId,
        },
        data: {
          shopId: input.shopId,
          ownerId: input.ownerId,
          processes: input.processes,
          materials: input.materials,
          principles: input.principles,
          description: input.description,
        },
      });

      return {
        data: updatedSurvey,
        message: "Survey updated successfully",
      };
    }),

  createFromOnboarding: protectedProcedure
    .input(
      z.object({
        shopId: z.string().optional(),
        businessType: z
          .string()
          .min(1, { message: "Business type is required" }),
        experience: z
          .string()
          .min(1, { message: "Experience level is required" }),
        description: z.string().min(1, { message: "Description is required" }),
        processes: z.string().optional(),
        materials: z.string().optional(),
        principles: z.string().optional(),

        // Optional Shop Fields
        storeName: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        bio: z.string().optional(),
        shopDescription: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        logo: z.string().optional(),
        profilePic: z.string().optional(),

        logoPhoto: z.string().optional().nullish(),
        ownerPhoto: z.string().optional().nullish(),

        ownerPhotoUrl: z.string().optional().nullable(),
        logoPhotoUrl: z.string().optional().nullable(),

        attributeTags: z.array(z.string()),
        ownerName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let shop;
      if (input.shopId) {
        shop = await ctx.db.shop.upsert({
          where: { id: input?.shopId ?? undefined },
          create: {
            name: input.storeName,
            ownerId: ctx.session.user.id,
            bio: input.bio ?? "",
            description: input.description ?? "",
            logoPhoto: input.logoPhoto,
            ownerPhoto: input.ownerPhoto,
            website: input.website ?? "",
            attributeTags: input.attributeTags,
            ownerName: input.ownerName ?? "",
          },
          update: {
            name: input.storeName,
            ownerName: input.ownerName ?? "",
            ownerId: ctx.session.user.id,
            bio: input.bio ?? "",
            description: input.description ?? "",
            logoPhoto: input.logoPhoto,
            ownerPhoto: input.ownerPhoto,
            website: input.website ?? "",
            attributeTags: input.attributeTags,
          },
        });
      } else {
        shop = await ctx.db.shop.create({
          data: {
            name: input.storeName,
            ownerName: input.ownerName ?? "",
            ownerId: ctx.session.user.id,
            bio: input.bio ?? "",
            description: input.description ?? "",
            logoPhoto: input.logoPhoto,
            ownerPhoto: input.ownerPhoto,
            website: input.website ?? "",
            attributeTags: input.attributeTags,
          },
        });
      }

      const survey = await ctx.db.survey.create({
        data: {
          shopId: shop.id,
          ownerId: ctx.session.user.id,
          processes: input.processes,
          materials: input.materials,
          principles: input.principles,
          description: input.description,
          experience: input.experience,
          businessType: input.businessType,
        },
      });

      if (ctx.session.user.role !== "ADMIN") {
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: {
            role: "ARTISAN",
          },
        });
      }

      return {
        data: {
          survey,
          shop,
        },
        message: "Survey created successfully",
      };
    }),

  modifyFromOnboarding: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
        shopId: z.string().optional(),
        businessType: z
          .string()
          .min(1, { message: "Business type is required" }),
        experience: z
          .string()
          .min(1, { message: "Experience level is required" }),
        description: z.string().min(1, { message: "Description is required" }),
        processes: z.string().optional(),
        materials: z.string().optional(),
        principles: z.string().optional(),

        // Optional Shop Fields
        storeName: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        bio: z.string().optional(),
        shopDescription: z.string().optional(),
        website: z.string().url().optional(),
        logo: z.string().optional(),
        profilePic: z.string().optional(),

        logoPhoto: z.string().optional().nullish(),
        ownerPhoto: z.string().optional().nullish(),

        ownerPhotoUrl: z.string().optional().nullable(),
        logoPhotoUrl: z.string().optional().nullable(),

        attributeTags: z.array(z.string()),
        ownerName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const survey = await ctx.db.survey.findUnique({
        where: { id: input.surveyId },
      });

      const shop = await ctx.db.shop.findUnique({
        where: { id: input.shopId ?? survey?.shopId },
      });

      if (!survey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey not found",
        });
      }

      if (!shop) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Shop not found",
        });
      }

      if (survey.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authorized to modify this survey",
        });
      }

      const updatedShop = await ctx.db.shop.update({
        where: { id: shop.id },
        data: {
          name: input.storeName,
          ownerName: input?.ownerName,
          bio: input.bio ?? "",
          description: input.description ?? "",
          logoPhoto: input.logoPhoto,
          ownerPhoto: input.ownerPhoto,
          website: input.website ?? "",
          attributeTags: input.attributeTags,
        },
      });

      const updatedSurvey = await ctx.db.survey.update({
        where: { id: input.surveyId },
        data: {
          processes: input.processes,
          materials: input.materials,
          principles: input.principles,
          description: input.description,
          experience: input.experience,
          businessType: input.businessType,
        },
      });

      if (ctx.session.user.role !== "ADMIN") {
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: {
            role: "ARTISAN",
          },
        });
      }

      return {
        data: {
          survey: updatedSurvey,
          shop: updatedShop,
        },
        message: "Survey updated successfully",
      };
    }),

  delete: elevatedProcedure
    .input(z.object({ surveyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const survey = await ctx.db.survey.findFirst({
        where: { id: input.surveyId },
      });

      if (!survey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "surveyId is required",
        });
      }

      if (
        survey.ownerId !== ctx.session.user.id &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete this survey",
        });
      }

      const deletedSurvey = await ctx.db.survey.delete({
        where: {
          id: input.surveyId,
        },
      });

      return {
        data: deletedSurvey,
        message: "Survey deleted successfully",
      };
    }),
});
