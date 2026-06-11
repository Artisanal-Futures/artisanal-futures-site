import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  priceInCents: z.coerce.number().int("Price must be a whole number of cents.").min(0, "Price cannot be negative.").max(100_000_000, "Price is too large.").optional().nullable(),
  // Constrain to supported currencies for the UI, but normalize unknown/null
  // values (e.g. from migration imports) to USD instead of failing validation.
  currency: z.preprocess(
    (v) =>
      typeof v === "string" && ["USD", "CAD", "EUR", "GBP"].includes(v)
        ? v
        : "USD",
    z.enum(["USD", "CAD", "EUR", "GBP"]),
  ),
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
