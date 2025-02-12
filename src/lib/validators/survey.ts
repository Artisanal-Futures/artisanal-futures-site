import { z } from "zod";

export const surveySchema = z.object({
  shopId: z.string(),
  ownerId: z.string(),

  businessType: z.string().optional(),
  experience: z.string().optional(),
  description: z.string().optional(),
  processes: z.string().optional(),
  materials: z.string().optional(),
  principles: z.string().optional(),
});
