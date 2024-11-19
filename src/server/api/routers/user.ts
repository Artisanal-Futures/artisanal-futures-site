import { z } from 'zod'

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '~/server/api/trpc'
import { uploadImage } from '~/utils/forum/cloudinary'

export const userRouter = createTRPCRouter({
  getAll: adminProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany()
    return users
  }),

  get: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          accounts: true,
          sessions: true,
          posts: true,
        },
      })

      return user
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.delete({
        where: { id: input.id },
      })

      return {
        data: user,
        message: `User with id '${input.id}' was deleted`,
      }
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      })

      return {
        data: user,
        message: `User with id '${input.id}' was updated`,
      }
    }),

  getForumProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input
      const user = await ctx.db.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          image: true,
          title: true,
        },
      })

      return user
    }),

  editForumProfile: protectedProcedure
    .input(z.object({ name: z.string().min(1), title: z.string().nullish() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          title: input.title,
        },
      })

      return user
    }),

  updateForumAvatar: protectedProcedure
    .input(z.object({ image: z.string().nullish() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          image: input.image,
        },
      })

      return user
    }),

  getForumMentionList: protectedProcedure
    .input(z.object({}).nullable())
    .query(({ ctx }) => {
      const users = ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      })

      return users
    }),

  getForumEmojiList: protectedProcedure
    .input(z.object({}).nullable())
    .query(async ({}) => {
      const gemoji = (await import('gemoji')).gemoji
      return gemoji
    }),

  uploadForumImage: protectedProcedure
    .input(z.any())
    .mutation(async ({ input: file }) => {
      return uploadImage(file as File)
    }),
})
