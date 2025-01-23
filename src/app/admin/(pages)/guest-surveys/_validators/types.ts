import { type GuestSurvey, type User } from '@prisma/client'
import * as z from 'zod'

import type { AdminColumn } from '~/types'

export const guestSurveySchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  country: z.string(),
  state: z.string(),
  artisanalPractice: z.string(),
})

export type GuestSurveyColumn = AdminColumn<GuestSurvey> & {
  user: User | null
}
export type GuestSurveyFormValues = z.infer<typeof guestSurveySchema>
