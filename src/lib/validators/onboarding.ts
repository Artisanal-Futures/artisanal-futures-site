import { z } from "zod";

const artisanOnboardingSchemaBase = z.object({
  // Invitation
  invitationCode: z.string().min(1, "Invitation code is required"),

  // Account
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().optional(),
  name: z.string().min(1, "Please enter your name"),

  // Business
  businessName: z.string().min(1, "Please enter your business name"),
  businessInterview: z
    .string()
    .min(1, "Please tell us about your business in the interview field"),
  businessLocation: z.string().optional(),
  businessEmail: z.string().optional(),
  businessTelephone: z.string().optional(),
  businessType: z.string().optional(),
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
  ownerName: z.string().min(1, "Please enter the owner's name"),
  ownerBio: z.string().optional(),
  publicDescription: z
    .string()
    .min(1, "Please add a short public description of your business"),
  logoFile: z.instanceof(File).optional().nullable(),
  ownerPhotoFile: z.instanceof(File).optional().nullable(),
  logoPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
  ownerPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const artisanOnboardingSchema = artisanOnboardingSchemaBase.refine(
  (data) =>
    data.confirmPassword === undefined ||
    data.password === data.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] },
);

export type SignupFormData = z.infer<typeof artisanOnboardingSchema>;

// API input for onboardGuest (no password/confirmPassword)
export const guestOnboardingSchema = z.object({
  invitationCode: z.string(),
  name: z.string(),
  country: z.string(),
  state: z.string(),
  artisanalPractice: z.string(),
  otherPractice: z.string(),
  email: z.string().email(),
});

// Full form schema for guest signup wizard (includes account fields + refines)
const guestSignupFormSchemaBase = z.object({
  invitationCode: z.string().min(1, "Invitation code is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().optional(),
  name: z.string().min(1, "Please enter your name"),
  country: z.string().min(1, "Please enter your country"),
  state: z.string().min(1, "Please enter your state or province"),
  artisanalPractice: z.string().min(1, "Please select your artisanal practice"),
  otherPractice: z.string().optional(),
});

export const guestSignupFormSchema = guestSignupFormSchemaBase
  .refine(
    (data) =>
      data.confirmPassword === undefined ||
      data.password === data.confirmPassword,
    { message: "Passwords do not match", path: ["confirmPassword"] },
  )
  .refine(
    (data) =>
      data.artisanalPractice !== "other" ||
      (data.otherPractice?.trim()?.length ?? 0) > 0,
    {
      message: "Please describe your artisanal practice",
      path: ["otherPractice"],
    },
  );

export type GuestSignupFormData = z.infer<typeof guestSignupFormSchema>;

// API input for onboardAdmin (invite code only — role is already set during sign-up)
export const adminOnboardingSchema = z.object({
  invitationCode: z.string(),
});

// Full form schema for admin signup wizard (code + account details only)
const adminSignupFormSchemaBase = z.object({
  invitationCode: z.string().min(1, "Invitation code is required"),
  name: z.string().min(1, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().optional(),
});

export const adminSignupFormSchema = adminSignupFormSchemaBase.refine(
  (data) =>
    data.confirmPassword === undefined ||
    data.password === data.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] },
);

export type AdminSignupFormData = z.infer<typeof adminSignupFormSchema>;
