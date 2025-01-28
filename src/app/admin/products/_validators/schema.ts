import { z } from "zod";

export const migrationTableSchema = z.object({
  type: z.string(),
  name: z.string(),
  database: z.string(),
  data: z.array(z.unknown()),
});

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  image: z.any().nullable(),
  priceInCents: z.coerce.number().nullable(),
  tags: z.array(z.object({ text: z.string(), id: z.string() })),
  currency: z.string().nullable(),
  productUrl: z.string().nullable(),
  attributeTags: z.array(z.string()),
  materialTags: z.array(z.string()),
  environmentalTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  imageUrl: z.string().nullable(),
  shopId: z.string().min(1, "Shop is required"),
  shopProductId: z.string(),
  scrapeMethod: z
    .enum(["MANUAL", "WORDPRESS", "SHOPIFY", "SQUARESPACE"])
    .default("MANUAL"),
});

export type ProductForm = z.infer<typeof productFormSchema>;
export type MigrationTable = z.infer<typeof migrationTableSchema>;
