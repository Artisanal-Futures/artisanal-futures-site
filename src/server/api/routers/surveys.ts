import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { checkUserShopPermissions } from "~/lib/check-user-permissions";
import { surveySchema } from "~/lib/validators/survey";
import {
  adminArtisanProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const surveysRouter = createTRPCRouter({
  getAll: adminArtisanProcedure.query(async ({ ctx }) => {
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
      where: {
        OR: [
          { ownerId: ctx.session.user.id },
          // Only match by survey.shopId when it exists: an `{ id: undefined }`
          // branch collapses to `{}` in Prisma and would match any shop.
          ...(survey?.shopId ? [{ id: survey.shopId }] : []),
        ],
      },
      // Narrow select: never return the owner's User row.
      select: { id: true, name: true },
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
  create: adminArtisanProcedure
    .input(surveySchema)
    .mutation(async ({ ctx, input }) => {
      const isShopAuthorized = await checkUserShopPermissions(
        ctx.session,
        input.shopId,
      );

      if (!isShopAuthorized) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Shop does not belong to current user",
        });
      }

      const survey = await ctx.db.survey.create({
        data: {
          shopId: input.shopId,
          // Only admins may create a survey on behalf of another user.
          ownerId:
            ctx.session.user.role === "ADMIN" && input.ownerId
              ? input.ownerId
              : ctx.session.user.id,
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

  update: adminArtisanProcedure
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

      const isShopAuthorized = await checkUserShopPermissions(
        ctx.session,
        input.shopId,
      );

      if (!isShopAuthorized) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Shop does not belong to current user",
        });
      }

      const updatedSurvey = await ctx.db.survey.update({
        where: {
          id: input.surveyId,
        },
        data: {
          shopId: input.shopId,
          ...(ctx.session.user.role === "ADMIN" && input.ownerId
            ? { ownerId: input.ownerId }
            : {}),
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

  delete: adminArtisanProcedure
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

  deleteMany: adminArtisanProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        // Non-admins may only delete their own surveys
        const surveys = await ctx.db.survey.findMany({
          where: { id: { in: input } },
          select: { id: true, ownerId: true },
        });
        const unauthorized = surveys.some(
          (s) => s.ownerId !== ctx.session.user.id,
        );
        if (unauthorized) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not authorized to delete one or more of these surveys",
          });
        }
      }

      await ctx.db.survey.deleteMany({
        where: { id: { in: input } },
      });

      return { message: `${input.length} survey(s) deleted successfully` };
    }),
});
