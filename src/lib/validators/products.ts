import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  priceInCents: z.coerce.number().int("Price must be a whole number of cents.").min(0, "Price cannot be negative.").max(100_000_000, "Price is too large.").optional().nullable(),
  // Only USD is offered. Force every value (including legacy import currencies
  // like CAD/EUR/GBP) to USD, while keeping the enum type stable for the forms.
  currency: z.preprocess(() => "USD", z.enum(["USD", "CAD", "EUR", "GBP"])),
  tags: z.array(z.object({ id: z.string(), text: z.string() })),
  attributeTags: z.array(z.string()),
  materialTags: z.array(z.string()),
  environmentalTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  shopId: z.string().min(1, "Shop selection is required."),
  shopProductId: z.string().optional().nullable(),
  scrapeMethod: z.enum([
    "MANUAL",
    "WORDPRESS",
    "SHOPIFY",
    "SQUARESPACE",
    "SIMPLEPRESS",
    "SQUARE",
  ]),
  categoryIds: z.array(z.string()).optional(),
  isFeatured: z.boolean(),
  isPublic: z.boolean().default(true),
  productUrl: z.string().url().optional().nullable().or(z.literal("")),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const productFormSchema = productSchema.extend({
  imageFile: z.instanceof(File).optional().nullable(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
