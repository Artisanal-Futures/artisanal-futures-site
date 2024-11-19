import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const surveysRouter = createTRPCRouter({
  getAllSurveys: protectedProcedure.query(({ ctx }) => {
    return ctx.db.survey.findMany()
  }),

  getSurvey: protectedProcedure
    .input(z.object({ surveyId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.survey.findUnique({
        where: {
          id: input.surveyId,
          ownerId: ctx.session.user.id,
        },
      })
    }),
  getCurrentUserSurvey: protectedProcedure.query(({ ctx }) => {
    return ctx.db.survey.findFirst({
      where: {
        ownerId: ctx.session.user.id,
      },
    })
  }),

  getCurrentUserShopSurvey: protectedProcedure
    .input(z.object({ shopId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.survey.findFirst({
        where: {
          ownerId: ctx.session.user.id,
          shopId: input.shopId,
        },
      })
    }),
  createSurvey: protectedProcedure
    .input(
      z.object({
        shopId: z.string(),
        processes: z.string().optional(),
        materials: z.string().optional(),
        principles: z.string().optional(),
        description: z.string().optional(),
        unmoderatedForm: z.boolean().default(false),
        moderatedForm: z.boolean().default(false),
        hiddenForm: z.boolean().default(false),
        privateForm: z.boolean().default(false),
        supplyChain: z.boolean().default(false),
        messagingOptIn: z.boolean().default(false),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.survey.create({
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
      })
    }),

  updateSurvey: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),

        processes: z.string().optional(),
        materials: z.string().optional(),
        principles: z.string().optional(),
        description: z.string().optional(),
        unmoderatedForm: z.boolean().default(false),
        moderatedForm: z.boolean().default(false),
        hiddenForm: z.boolean().default(false),
        privateForm: z.boolean().default(false),
        supplyChain: z.boolean().default(false),
        messagingOptIn: z.boolean().default(false),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (!input.surveyId)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Shop id is required',
        })

      return ctx.db.survey
        .findFirst({
          where: {
            id: input.surveyId,
            ownerId: ctx.session.user.id,
          },
        })
        .then((shopByUserId) => {
          if (!shopByUserId) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Shop id does not belong to current user',
            })
          }
        })
        .then(() => {
          return ctx.db.survey.update({
            where: {
              id: input.surveyId,
            },
            data: {
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
          })
        })
        .catch((err) => {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong. Please try again later.',
            cause: err,
          })
        })
    }),

  deleteSurvey: protectedProcedure
    .input(
      z.object({
        surveyId: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (!input.surveyId)
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'surveyId is required',
        })

      return ctx.db.survey
        .findFirst({
          where: {
            id: input.surveyId,
            ownerId: ctx.session.user.id,
          },
        })
        .then((shopByUserId) => {
          if (!shopByUserId) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'survey id does not belong to current user',
            })
          }
        })
        .then(() => {
          return ctx.db.survey.delete({
            where: {
              id: input.surveyId,
            },
          })
        })
        .catch((err) => {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong. Please try again later.',
            cause: err,
          })
        })
    }),
})
