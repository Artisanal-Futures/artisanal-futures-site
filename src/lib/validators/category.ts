import { CategoryType } from "generated/prisma";
import z from "zod";

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters long."),
  parentId: z.string().nullable().optional(),
  type: z.nativeEnum(CategoryType).optional(),
});
