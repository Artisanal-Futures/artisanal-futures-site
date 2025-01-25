import {
  adminProcedure,
  createTRPCRouter,
  elevatedProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { z } from "zod";

import { TRPCError } from "@trpc/server";

import { surveySchema } from "~/lib/validators/survey";

export const surveysRouter = createTRPCRouter({
  getAll: adminProcedure.query(({ ctx }) => {
    return ctx.db.survey.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
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
  getCurrentUserSurvey: protectedProcedure.query(({ ctx }) => {
    return ctx.db.survey.findFirst({
      where: {
        ownerId: ctx.session.user.id,
      },
    });
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
          unmoderatedForm: input.unmoderatedForm,
          moderatedForm: input.moderatedForm,
          hiddenForm: input.hiddenForm,
          privateForm: input.privateForm,
          supplyChain: input.supplyChain,
          messagingOptIn: input.messagingOptIn,
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
          unmoderatedForm: input.unmoderatedForm,
          moderatedForm: input.moderatedForm,
          hiddenForm: input.hiddenForm,
          privateForm: input.privateForm,
          supplyChain: input.supplyChain,
          messagingOptIn: input.messagingOptIn,
        },
      });

      return {
        data: updatedSurvey,
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
