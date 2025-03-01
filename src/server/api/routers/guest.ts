import { emailService } from '@dreamwalker-studios/email'
import { env as emailEnv } from '@dreamwalker-studios/email/env'
import { z } from 'zod'

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc'
import { InquiryTemplate } from '~/services/email/blueprints/inquiry-template'
import { WelcomeGuestEmail } from '~/services/email/blueprints/welcome-guest'

export const guestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        country: z.string(),
        state: z.string(),
        artisanalPractice: z.string(),
        otherPractice: z.string(),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const guest = await ctx.db.guestSurvey.create({
        data: {
          name: input.name,
          country: input.country,
          state: input.state,
          artisanalPractice: input.artisanalPractice,
          otherPractice: input.otherPractice,
          email: ctx.session.user.email!,
          userId: ctx.session.user.id,
        },
      })

      await emailService.sendEmail({
        from: emailEnv.NO_RESPOND_EMAIL,
        to: ctx.session.user.email!,
        subject: 'Welcome to Artisanal Futures',
        template: WelcomeGuestEmail,
        data: {
          name: input.name,
          webinarLink: 'https://wpi.zoom.us/j/99084453348',
        },
      })

      return {
        data: guest,
        message: 'Survey submitted successfully',
      }
    }),

  isCompleted: protectedProcedure.query(async ({ ctx }) => {
    const guests = await ctx.db.guestSurvey.findFirst({
      where: {
        OR: [
          { userId: ctx.session.user.id },
          { email: ctx.session.user.email! },
        ],
      },
    })
    return !!guests
  }),

  getAll: adminProcedure.query(async ({ ctx }) => {
    const guests = await ctx.db.guestSurvey.findMany()
    return guests
  }),

  sendInquiry: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        body: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const email = await emailService.sendEmail({
        from: emailEnv.NO_RESPOND_EMAIL,
        to: input.email,
        subject: 'New Inquiry',
        template: InquiryTemplate,
        data: {
          fullName: input.name,
          message: input.body,
          email: input.email,
        },
      })

      return {
        data: email,
        message: 'Email sent. We will get back to you shortly',
      }
    }),

  // onboard: protectedProcedure
  //   .input(
  //     z.object({
  //       businessType: z
  //         .string()
  //         .min(1, { message: 'Business type is required' }),
  //       experience: z.enum(['beginner', 'intermediate', 'expert'], {
  //         required_error: 'Experience level is required',
  //       }),
  //       goals: z.string().min(1, { message: 'Goals are required' }),
  //       storeName: z.string().min(1, { message: 'Store name is required' }),

  //       firstName: z.string().min(1, { message: 'First name is required' }),
  //       lastName: z.string().min(1, { message: 'Last name is required' }),
  //       bio: z.string().min(1, { message: 'Bio is required' }),
  //       processes: z.string().optional(),
  //       materials: z.string().optional(),
  //       principles: z.string().optional(),
  //       description: z.string().optional(),
  //       unmoderatedForm: z.boolean().default(false),
  //       moderatedForm: z.boolean().default(false),
  //       hiddenForm: z.boolean().default(false),
  //       privateForm: z.boolean().default(false),
  //       supplyChain: z.boolean().default(false),
  //       messagingOptIn: z.boolean().default(false),
  //       logoPhoto: z.string().optional(),
  //       ownerPhoto: z.string().optional(),
  //       street: z.string().optional(),
  //       additional: z.string().optional(),
  //       city: z.string().optional(),
  //       state: z.string().optional(),
  //       zip: z.string().optional(),
  //       country: z.string().optional(),
  //       phone: z.string().optional(),
  //       email: z.string().optional(),
  //       website: z.string().optional(),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const store = await ctx.db.shop.findFirst({
  //       where: {
  //         ownerId: ctx.session.user.id,
  //       },
  //     })

  //     const survey = await ctx.db.survey.findFirst({
  //       where: {
  //         ownerId: ctx.session.user.id,
  //       },
  //     })

  //     if (!store) {
  //       const newStore = await ctx.db.shop.create({
  //         data: {
  //           ownerId: ctx.session.user.id,
  //           shopName: input.storeName,
  //           description: input.description,
  //           address: input.street,
  //           city: input.city,
  //           state: input.state,
  //           zip: input.zip,
  //           country: input.country,
  //           logoPhoto: input.logoPhoto,
  //           email: input.email,
  //           phone: input.phone,
  //           website: input.website,
  //           ownerName: `${input.firstName} ${input.lastName}`,
  //         },
  //       })
  //     }

  //     if (!survey) {
  //       const newSurvey = await ctx.db.survey.create({
  //         data: {
  //           ownerId: ctx.session.user.id,
  //           shopId: store?.id,
  //           processes: input.processes,
  //           materials: input.materials,
  //           principles: input.principles,
  //         },
  //       })
  //     }
  //   }),
})
