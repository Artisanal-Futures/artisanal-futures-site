import { z } from "zod";

export const shopSchema = z.object({
  name: z.string().min(1, "Shop name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  bio: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  email: z
    .string()
    .email("Invalid email address")
    .or(z.literal(""))
    .optional()
    .nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  attributeTags: z.array(z.string()),
  ownerId: z.string().optional().nullable(),

  ownerPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
  logoPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
  isPublic: z.boolean().default(true),
});

export const shopFormSchema = shopSchema.extend({
  ownerPhotoFile: z.instanceof(File).optional().nullable(),
  logoPhotoFile: z.instanceof(File).optional().nullable(),
});

export const shopUpdateSchema = shopSchema.extend({
  id: z.string(),
  ownerPhotoUrl: z.string().url().optional().or(z.literal("")),
  logoPhotoUrl: z.string().url().optional().or(z.literal("")),
});

export type ShopFormData = z.infer<typeof shopFormSchema>;
