import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { emailService } from '~/services/email'
import { WelcomeGuestEmail } from '~/services/email/blueprints/welcome-guest'
import { emailConfig } from '~/services/email/config'

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
        },
      })

      await emailService.sendEmail({
        from: emailConfig.noRespondEmail,
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
    const guests = await ctx.db.guestSurvey.findMany({
      where: {
        email: ctx.session.user.email!,
      },
    })
    return guests.length > 0
  }),
})
