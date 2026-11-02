import { z } from "zod";

import {
  OTHER_SECTOR_SLUG,
  SECTOR_COLOR_KEYS,
} from "~/lib/constants/shop-sectors";
import { slugify } from "~/lib/utils";

/**
 * The editable fields of a shop sector. The slug is deliberately absent: the
 * server derives it from the name on create and never changes it.
 */
export const shopSectorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long.")
    .max(60, "Keep the name under 60 characters.")
    .refine((name) => slugify(name) !== "", {
      message: "Name needs at least one letter or number.",
    })
    .refine((name) => slugify(name) !== OTHER_SECTOR_SLUG, {
      message: '"Other" is reserved for shops without a sector.',
    }),
  shortName: z
    .string()
    .trim()
    .max(24, "Keep the short name under 24 characters.")
    .nullish(),
  description: z
    .string()
    .trim()
    .max(280, "Keep the description under 280 characters.")
    .nullish(),
  colorKey: z.enum(SECTOR_COLOR_KEYS, { message: "Choose a color." }),
});

export type ShopSectorFormValues = z.infer<typeof shopSectorSchema>;
