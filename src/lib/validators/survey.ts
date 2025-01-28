import { z } from "zod";

export const surveySchema = z.object({
  shopId: z.string(),
  ownerId: z.string(),
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

  experience: z.string().optional(),
  businessType: z.string().optional(),
});
