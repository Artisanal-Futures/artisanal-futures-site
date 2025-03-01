import { z } from "zod";

export const productSchema = z.object({
  name: z.string(),
  description: z.string(),
  priceInCents: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  productUrl: z.string().optional().nullable(),
  tags: z.array(z.string()),
  attributeTags: z.array(z.string()),
  materialTags: z.array(z.string()),
  environmentalTags: z.array(z.string()),
  aiGeneratedTags: z.array(z.string()),
  scrapeMethod: z
    .enum(["MANUAL", "WORDPRESS", "SHOPIFY", "SQUARESPACE"])
    .default("MANUAL"),
  shopId: z.string(),
});
