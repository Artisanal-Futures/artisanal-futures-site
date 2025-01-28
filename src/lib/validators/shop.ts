import { z } from "zod";

export const shopSchema = z.object({
  name: z.string().min(1, "Shop name is required"),
  ownerName: z.string().optional(),
  ownerId: z.string().optional(),
  bio: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  logoPhoto: z.any().nullable(),
  ownerPhoto: z.any().nullable(),
  coverPhoto: z.any().nullable(),
  country: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
  attributeTags: z.array(z.string()).optional(),
});
