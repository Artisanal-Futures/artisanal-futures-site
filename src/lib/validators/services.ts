import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  priceInCents: z.coerce.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  durationInMinutes: z.coerce.number().optional().nullable(),
  locationType: z.string().optional().nullable(),
  tags: z.array(z.string()),
  attributeTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  shopId: z.string().min(1, "Shop is required."),
  isPublic: z.boolean().default(false),
  categoryIds: z.array(z.string()).optional(),
});
