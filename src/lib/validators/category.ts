import { CategoryType } from "generated/prisma";
import z from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  parentId: z.string().nullable().optional(),
  type: z.nativeEnum(CategoryType).optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
