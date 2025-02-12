import { z } from "zod";

export const artisanOnboardingFormSchema = z.object({
  // Survey Fields
  businessType: z.string().min(1, { message: "Business type is required" }),
  experience: z.string().min(1, { message: "Experience level is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  processes: z.string().optional(),
  materials: z.string().optional(),
  principles: z.string().optional(),

  // Shop Fields
  storeName: z.string().min(1, { message: "Shop name is required" }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  shopDescription: z.string().optional(),
  website: z.string().url().optional(),
  logo: z.string().optional(),
  profilePic: z.string().optional(),

  ownerPhoto: z.any().nullable(),
  logoPhoto: z.any().nullable(),

  ownerPhotoUrl: z.string().optional().nullable(),
  logoPhotoUrl: z.string().optional().nullable(),
});
export type ArtisanOnboardingFormSchemaType = z.infer<
  typeof artisanOnboardingFormSchema
>;
