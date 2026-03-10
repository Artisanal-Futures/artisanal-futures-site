import { z } from "zod";

export const surveyFormSchema = z.object({
  processes: z.string().optional(),
  materials: z.string().optional(),
  principles: z.string().optional(),
  description: z.string().optional(),
  unmoderatedForm: z.boolean(),
  moderatedForm: z.boolean(),
  hiddenForm: z.boolean(),
  privateForm: z.boolean(),
  supplyChain: z.boolean(),
  messagingOptIn: z.boolean(),
  shopId: z.string().min(1, "Shop ID is required"),
  ownerId: z.string().min(1, "Owner ID is required"),
});

export type SurveyFormSchema = z.infer<typeof surveyFormSchema>;
