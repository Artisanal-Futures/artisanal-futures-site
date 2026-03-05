import { z } from "zod";

export const artisanOnboardingSchema = z.object({
  // Invitation
  invitationCode: z.string(),

  // Account
  email: z.string(),
  password: z.string(),
  name: z.string(),

  // Business
  businessName: z.string(),
  businessInterview: z.string(),
  businessLocation: z.string().optional(),
  businessEmail: z.string().optional(),
  businessTelephone: z.string().optional(),
  businessType: z.array(z.string()),
  businessTypeOther: z.string().optional(),
  productCategories: z.array(z.string()),
  productCategoriesOther: z.string().optional(),
  principles: z.array(z.string()),
  principlesOther: z.string().optional(),
  commonProcesses: z.array(z.string()),
  commonProcessesOther: z.string().optional(),
  materialsUsed: z.array(z.string()),
  materialsUsedOther: z.string().optional(),
  websiteLink: z.string().optional(),
  socialMediaLinks: z.string().optional(),

  // Artisan profile
  ownerName: z.string(),
  ownerBio: z.string().optional(),
  publicDescription: z.string(),
  logoFile: z.instanceof(File).optional().nullable(),
  ownerPhotoFile: z.instanceof(File).optional().nullable(),
  logoPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
  ownerPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const guestOnboardingSchema = z.object({
  invitationCode: z.string(),
  name: z.string(),
  country: z.string(),
  state: z.string(),
  artisanalPractice: z.string(),
  otherPractice: z.string(),
  email: z.string().email(),
});
