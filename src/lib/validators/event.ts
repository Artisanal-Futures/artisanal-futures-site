import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  callToActionLink: z.string().url().optional().nullable().or(z.literal("")),
  shopId: z.string().min(1, "Shop is required"),
});

export const eventFormSchema = eventSchema.extend({
  imageFile: z.instanceof(File).optional().nullable(),
});

export type EventFormData = z.infer<typeof eventFormSchema>;
