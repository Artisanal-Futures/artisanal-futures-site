import { z } from "zod";

export const shopFormSchema = z.object({
  name: z.string().min(1, "Shop name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  bio: z.string().optional(),
  description: z.string().optional(),
  ownerPhoto: z.any().nullable(),
  logoPhoto: z.any().nullable(),
  coverPhoto: z.any().nullable(),
  website: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  attributeTags: z.array(z.string()),

  ownerPhotoUrl: z.string().optional().nullable(),
  logoPhotoUrl: z.string().optional().nullable(),
  coverPhotoUrl: z.string().optional().nullable(),
});

export type ShopFormSchema = z.infer<typeof shopFormSchema>;
