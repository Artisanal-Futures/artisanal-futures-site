import { z } from 'zod'

const baseProjectSchema = z.object({
  title: z.string(),
  project_type: z
    .array(z.string())
    .refine((value) => value.some((item) => item), {
      message: 'You have to select at least one item.',
    }),
  description: z.string().min(85, {
    message:
      'Description must be at least 85 words long. Please provide a detailed explanation of your project, including its goals, scope, and any specific requirements or challenges you anticipate. This will help potential contributors better understand and engage with your project.',
  }),
  image: z.any().optional().nullable(),

  link_to_project: z.string().refine(
    (value) => {
      const urlPattern =
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
      return urlPattern.test(value)
    },
    {
      message: 'Please enter a valid URL (with or without http/https)',
    },
  ),

  is_public: z.boolean().default(false),
  email: z.string().email(),
})

export const newProjectSchema = baseProjectSchema.extend({
  first_prompt: z.string(),
  second_prompt: z.string(),
  third_prompt: z.string(),
  online_demo: z.boolean().default(false),
  needs_support: z.boolean().default(false),
})

export const updateProjectSchema = baseProjectSchema.extend({
  email: z.string().email(),
})

export const projectSchema = baseProjectSchema.extend({
  first_prompt: z.string(),
  second_prompt: z.string(),
  third_prompt: z.string(),
  online_demo: z.boolean().default(false),
  needs_support: z.boolean().default(false),
  email: z.string().email(),
})
export const migrationTableSchema = z.object({
  type: z.string(),
  name: z.string(),
  database: z.string(),
  data: z.array(z.unknown()),
})

export type MigrationTable = z.infer<typeof migrationTableSchema>
