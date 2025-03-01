import { z } from "zod";

export const surveyFormSchema = z.object({
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
  shopId: z.string().min(1, "Shop ID is required"),
  ownerId: z.string().min(1, "Owner ID is required"),
});

export type SurveyFormSchema = z.infer<typeof surveyFormSchema>;
