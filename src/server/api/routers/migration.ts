import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '~/server/api/trpc'
import { db } from '~/server/db'

export const migrationRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    // Find sessions where the userId doesn't exist in the users table
    const orphanedSessions = await ctx.db.session.findMany({
      where: {
        userId: {
          notIn: (await db.user.findMany()).map((user) => user.id),
        },
      },
    })

    return orphanedSessions
  }),

  migrateUsernames: publicProcedure.mutation(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: {
        name: {
          not: null,
        },
      },
    })

    for (const user of users) {
      if (!user.name) continue

      // Create base username by removing spaces and special chars
      const baseUsername = user.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      let username = baseUsername
      let usernameExists = true

      while (usernameExists) {
        // Check if username exists
        const existingUser = await ctx.db.user.findFirst({
          where: {
            username: username,
            id: {
              not: user.id, // Don't match the current user
            },
          },
        })

        if (!existingUser) {
          usernameExists = false
        } else {
          // Add 4 random digits
          const randomDigits = Math.floor(Math.random() * 9000 + 1000)
          username = `${baseUsername}${randomDigits}`
        }
      }

      // Update the user with the valid username
      await ctx.db.user.update({
        where: {
          id: user.id,
        },
        data: {
          username,
        },
      })
    }
  }),
})
