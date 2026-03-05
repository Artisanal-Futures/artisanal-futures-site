import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  priceInCents: z.coerce.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  durationInMinutes: z.coerce.number().optional().nullable(),
  locationType: z.string().optional().nullable(),
  tags: z.array(z.object({ id: z.string(), text: z.string() })),
  attributeTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  shopId: z.string().min(1, "Shop is required."),
  isFeatured: z.boolean(),
  categoryIds: z.array(z.string()).optional(),
  serviceUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const serviceFormSchema = serviceSchema.extend({
  imageFile: z.instanceof(File).optional().nullable(),
});

export type ServiceFormData = z.infer<typeof serviceFormSchema>;
