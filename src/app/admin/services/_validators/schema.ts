import { z } from "zod";

export const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  image: z.any().nullable(),
  priceInCents: z.coerce.number().nullable(),
  tags: z.array(z.object({ text: z.string(), id: z.string() })),
  currency: z.string().nullable(),
  attributeTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  imageUrl: z.string().nullable(),
  shopId: z.string().min(1, "Shop is required"),
  
  durationInMinutes: z.coerce.number().nullable(),
  locationType: z.string().nullable(),
});

export type ServiceForm = z.infer<typeof serviceFormSchema>;
