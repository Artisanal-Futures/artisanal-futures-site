import { z } from "zod";

export const updateAccountSchema = z.object({
  name: z.string(),
  username: z.string(),
  image: z.string().optional(),
});
