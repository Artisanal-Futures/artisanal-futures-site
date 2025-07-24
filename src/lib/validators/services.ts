import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string(),
  description: z.string(),
  priceInCents: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  tags: z.array(z.string()),
  attributeTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  shopId: z.string(),
  
  durationInMinutes: z.number().optional().nullable(),
  locationType: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
});