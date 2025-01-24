import * as z from 'zod'

import type { AdminColumn } from '~/types'
import { type UpcyclingItem } from '~/types'

export const upcyclingSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  project_title: z.string(),
  prompt: z.string(),
})

export type UpcyclingColumn = AdminColumn<UpcyclingItem>
export type UpcyclingFormValues = z.infer<typeof upcyclingSchema>
