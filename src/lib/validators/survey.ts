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

  unmoderatedForm: z.boolean().optional(),
  moderatedForm: z.boolean().optional(),
  hiddenForm: z.boolean().optional(),
  privateForm: z.boolean().optional(),
  supplyChain: z.boolean().optional(),
  messagingOptIn: z.boolean().optional(),
});
