import { z } from "zod";

export const guestOnboardingFormSchema = z.object({
  name: z.string(),
  country: z.string(),
  state: z.string(),
  artisanalPractice: z.string(),
  otherPractice: z.string(),
  email: z.string().email(),
});

export type GuestOnboardingFormSchemaType = z.infer<
  typeof guestOnboardingFormSchema
>;
