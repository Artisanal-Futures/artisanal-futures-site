import { z } from "zod";

import { shopSeoSchema, urlListSchema } from "./seo";

/**
 * How precisely a shop's location is shown publicly. Mirrors the Prisma
 * `ShopLocationType` enum; HOME_BASED is the default so a street address is
 * never published unless the shop opts in as a storefront.
 */
export const SHOP_LOCATION_TYPES = {
  STOREFRONT: {
    label: "Storefront",
    description:
      "A public place customers can visit. Exact pin; street address shown.",
  },
  HOME_BASED: {
    label: "Home-based",
    description:
      "Works from home. The map shows the general area; your street address stays private.",
  },
  AREA: {
    label: "Area only",
    description: "Just a city or zip, no street address.",
  },
} as const;

export type ShopLocationTypeValue = keyof typeof SHOP_LOCATION_TYPES;

export const shopLocationTypeSchema = z.enum([
  "STOREFRONT",
  "HOME_BASED",
  "AREA",
]);

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
  locationType: shopLocationTypeSchema.default("HOME_BASED"),
  attributeTags: z.array(z.string()),
  ownerId: z.string().optional().nullable(),

  /** Profile links (Instagram, Etsy, ...). Artisan-editable. */
  socialLinks: urlListSchema.optional(),

  ownerPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
  logoPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
  coverPhotoUrl: z.string().url().optional().nullable().or(z.literal("")),
  isPublic: z.boolean().default(true),

  /**
   * Admin-only: slug and search/share overrides. The server rejects any
   * non-admin request that includes it, so artisans' forms must omit it.
   */
  seo: shopSeoSchema.optional(),
});

export const shopFormSchema = shopSchema.extend({
  ownerPhotoFile: z.instanceof(File).optional().nullable(),
  logoPhotoFile: z.instanceof(File).optional().nullable(),
  coverPhotoFile: z.instanceof(File).optional().nullable(),
  seoImageFile: z.instanceof(File).optional().nullable(),
});

export const shopUpdateSchema = shopSchema.extend({
  id: z.string(),
  ownerPhotoUrl: z.string().url().optional().or(z.literal("")),
  logoPhotoUrl: z.string().url().optional().or(z.literal("")),
  coverPhotoUrl: z.string().url().optional().or(z.literal("")),
});

export type ShopFormData = z.infer<typeof shopFormSchema>;
export type ShopFormInput = z.input<typeof shopFormSchema>;
