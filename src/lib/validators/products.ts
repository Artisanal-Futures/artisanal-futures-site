import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().min(1, "Description is required."),
  priceInCents: z.coerce.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  tags: z.array(z.object({ id: z.string(), text: z.string() })),
  attributeTags: z.array(z.string()),
  materialTags: z.array(z.string()),
  environmentalTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  shopId: z.string().min(1, "Shop selection is required."),
  shopProductId: z.string().optional().nullable(),
  scrapeMethod: z.enum(["MANUAL", "WORDPRESS", "SHOPIFY", "SQUARESPACE"]),
  categoryIds: z.array(z.string()).optional(),
  isFeatured: z.boolean(),
  productUrl: z.string().url().optional().nullable().or(z.literal("")),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const productFormSchema = productSchema.extend({
  imageFile: z.instanceof(File).optional().nullable(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
