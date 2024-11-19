import axios from 'axios'
import { z } from 'zod'

import { env } from '~/env'
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from '~/server/api/trpc'
import { type UpcyclingItem } from '~/types'

const AI_AGENT_BACKEND_URL = `${env.AI_AGENT_BACKEND_URL}/sdm/api/v2`

export const upcyclingRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const response = await axios.get(`${AI_AGENT_BACKEND_URL}/list/upcycle`)

    const generations = response.data as UpcyclingItem[]

    const users = await ctx.db.user.findMany({
      where: { id: { in: generations.map((g) => g.user_id) } },
    })

    const generationsWithUser = generations.map((g) => ({
      ...g,
      user: users.find((u) => u.id === g.user_id) ?? null,
    }))

    return generationsWithUser as UpcyclingItem[]
  }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const response = await axios.delete(
        `${AI_AGENT_BACKEND_URL}/delete/upcycle/${input.id}`,
      )
      return {
        data: response.data,
        message: 'Upcycling item deleted successfully',
      }
    }),
})
