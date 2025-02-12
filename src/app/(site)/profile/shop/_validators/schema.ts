import * as z from "zod";

export const shopFormSchema = z.object({
  name: z.string().min(2),
  ownerName: z.string(),
  bio: z.string().optional(),
  description: z.string().optional(),
  logoPhoto: z.string().optional(),
  ownerPhoto: z.string().optional(),
  website: z.string().optional(),
});

export type ShopFormValues = z.infer<typeof shopFormSchema>;
