import { z } from "zod";

const eventBaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  callToActionLink: z.string().url().optional().nullable().or(z.literal("")),
  shopId: z.string().min(1, "Shop is required"),
  persist: z.boolean(),
});

const endNotBeforeStart = (data: {
  startDate: Date;
  endDate?: Date | null;
}) => !data.endDate || data.endDate >= data.startDate;

const endNotBeforeStartError = {
  message: "End date must be on or after the start date",
  path: ["endDate"],
};

export const eventSchema = eventBaseSchema.refine(
  endNotBeforeStart,
  endNotBeforeStartError,
);

export const eventUpdateSchema = eventBaseSchema
  .extend({ id: z.string() })
  .refine(endNotBeforeStart, endNotBeforeStartError);

export const eventFormSchema = eventBaseSchema
  .extend({ imageFile: z.instanceof(File).optional().nullable() })
  .refine(endNotBeforeStart, endNotBeforeStartError);

export type EventFormData = z.infer<typeof eventFormSchema>;
