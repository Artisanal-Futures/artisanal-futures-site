import * as z from "zod";

export const surveyFormSchema = z.object({
  businessType: z.string().optional(),
  experience: z.string().optional(),
  description: z.string().optional(),
  processes: z.string().optional(),
  materials: z.string().optional(),
  principles: z.string().optional(),
});

export type SurveyFormValues = z.infer<typeof surveyFormSchema>;
