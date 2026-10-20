import { z } from "zod";

/**
 * Admin-only private contact for the real artisan behind a shop that an admin
 * owns. Every field is optional; blank values are normalised to null on the
 * server, and an all-blank submission clears the record.
 */
export const shopPrivateContactSchema = z.object({
  shopId: z.string().min(1),
  name: z.string().trim().max(200).optional(),
  email: z
    .union([z.string().trim().email("Enter a valid email"), z.literal("")])
    .optional(),
  phone: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const shopPrivateContactFormSchema = shopPrivateContactSchema.omit({
  shopId: true,
});

export type ShopPrivateContactInput = z.infer<typeof shopPrivateContactSchema>;
export type ShopPrivateContactFormInput = z.infer<
  typeof shopPrivateContactFormSchema
>;
