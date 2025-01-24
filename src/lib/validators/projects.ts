import * as z from "zod";

export const createProjectSchema = z.object({
  title: z.string(),
  project_type: z.array(z.string()),
  description: z.string(),
  image_name: z.string(),
  first_prompt: z.string().optional(),
  second_prompt: z.string().optional(),
  third_prompt: z.string().optional(),
  link_to_project: z.string(),
  online_demo: z.boolean().default(false),
  is_public: z.boolean().default(false),
  needs_support: z.boolean().default(false),
  email: z.string(),
});

export const updateProjectSchema = z.object({
  id: z.number(),
  title: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
  image_name: z.string().optional(),
  link_to_project: z.string(),
  is_public: z.boolean(),
  email: z.string().optional(),
  online_demo: z.boolean().default(false),
  needs_support: z.boolean().default(false),
});

export const pageResultsSchema = z.object({
  pageNumber: z.number(),
  totalItems: z.number().optional().default(12),
});

export const publicProjectSchema = z.object({
  title: z.string(),
  project_type: z
    .array(z.string())
    .refine((value) => value.some((item) => item), {
      message: "You have to select at least one item.",
    }),
  description: z.string().min(85, {
    message:
      "Description must be at least 85 words long. Please provide a detailed explanation of your project, including its goals, scope, and any specific requirements or challenges you anticipate. This will help potential contributors better understand and engage with your project.",
  }),
  image: z.any().optional().nullable(),

  link_to_project: z.string().refine(
    (value) => {
      const urlPattern =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      return urlPattern.test(value);
    },
    {
      message: "Please enter a valid URL (with or without http/https)",
    },
  ),

  is_public: z.boolean().default(false),
  online_demo: z.boolean().default(false),
  needs_support: z.boolean().default(false),
});
