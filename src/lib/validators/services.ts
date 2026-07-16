import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  priceInCents: z.coerce.number().int("Price must be a whole number of cents.").min(0, "Price cannot be negative.").max(100_000_000, "Price is too large.").optional().nullable(),
  // Only USD is offered. Force every value (including legacy import currencies
  // like CAD/EUR/GBP) to USD, while keeping the enum type stable for the forms.
  currency: z.preprocess(() => "USD", z.enum(["USD", "CAD", "EUR", "GBP"])),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  durationInMinutes: z.coerce.number().int("Duration must be a whole number of minutes.").min(0, "Duration cannot be negative.").max(100_000, "Duration is too large.").optional().nullable(),
  locationType: z.string().optional().nullable(),
  tags: z.array(z.object({ id: z.string(), text: z.string() })),
  attributeTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  shopId: z.string().min(1, "Shop is required."),
  isFeatured: z.boolean(),
  isPublic: z.boolean().default(false),
  categoryIds: z.array(z.string()).optional(),
  serviceUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const serviceFormSchema = serviceSchema.extend({
  imageFile: z.instanceof(File).optional().nullable(),
});

export type ServiceFormData = z.infer<typeof serviceFormSchema>;
