import { z } from "zod";

import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().min(1).optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string().min(1) : z.string().url(),
    ),
    // Add `.min(1) on ID and SECRET if you want to make sure they're not empty
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),

    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    AUTH0_CLIENT_ID: z.string().min(1),
    AUTH0_CLIENT_SECRET: z.string().min(1),
    AUTH0_ISSUER: z.string().min(1),

    HOSTNAME: z.string(),

    RESEND_API_KEY: z.string(),

    GOOGLE_PLACES_API_KEY: z.string(),

    AI_AGENT_BACKEND_URL: z.string().url(),

    MINIO_ACCESS_KEY: z.string(),
    MINIO_SECRET_KEY: z.string(),
    MINIO_ENDPOINT: z.string(),
    COOLIFY_ADMIN_SAFE_API_TOKEN: z.string().min(1),
    COOLIFY_API: z.string().url(),
    COOLIFY_UUID: z.string().min(1),
    WORDPRESS_DOCKER_REGISTRY: z.string().min(1)
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_HOSTNAME: z.string(),
    NEXT_PUBLIC_SUPPORT_EMAIL: z.string(),
    NEXT_PUBLIC_STORAGE_URL: z.string(),
    NEXT_PUBLIC_HEART_VOTE_DISABLED: z.preprocess(
      (str) => str === "true" || str === true,
      z.boolean().optional().default(false),
    ),
    NEXT_PUBLIC_VOTE_DISABLED: z.preprocess(
      (str) => str === "true" || str === true,
      z.boolean().optional().default(false),
    ),
    NEXT_PUBLIC_NEGATIVE_VOTE_DISABLED: z.preprocess(
      (str) => str === "true" || str === true,
      z.boolean().optional().default(false),
    ),
    NEXT_PUBLIC_ENABLE_IMAGE_UPLOAD: z
      .string()
      .refine((s) => s === "true" || s === "false")
      .transform((s) => s === "true")
      .optional(),

    NEXT_PUBLIC_PASSWORD_PROTECT: z.string().min(1),

    NEXT_PUBLIC_APP_URL: z.string().url(),

    NEXT_PUBLIC_IS_GUEST_ONBOARDING: z.preprocess(
      (str) => str === "true" || str === true,
      z.boolean().optional().default(false),
    ),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NEXT_PUBLIC_IS_GUEST_ONBOARDING:
      process.env.NEXT_PUBLIC_IS_GUEST_ONBOARDING,
    NEXT_PUBLIC_STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL,
    NEXT_PUBLIC_HOSTNAME: process.env.NEXT_PUBLIC_HOSTNAME,
    NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    COOLIFY_API: process.env.COOLIFY_API,
    COOLIFY_ADMIN_SAFE_API_TOKEN: process.env.COOLIFY_ADMIN_SAFE_API_TOKEN,
    COOLIFY_UUID: process.env.COOLIFY_UUID,

    NEXT_PUBLIC_VOTE_DISABLED: process.env.NEXT_PUBLIC_VOTE_DISABLED,
    NEXT_PUBLIC_HEART_VOTE_DISABLED:
      process.env.NEXT_PUBLIC_HEART_VOTE_DISABLED,
    NEXT_PUBLIC_NEGATIVE_VOTE_DISABLED:
      process.env.NEXT_PUBLIC_NEGATIVE_VOTE_DISABLED,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ENABLE_IMAGE_UPLOAD:
      process.env.NEXT_PUBLIC_ENABLE_IMAGE_UPLOAD,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_ISSUER: process.env.AUTH0_ISSUER,

    NEXT_PUBLIC_PASSWORD_PROTECT: process.env.NEXT_PUBLIC_PASSWORD_PROTECT,

    HOSTNAME: process.env.HOSTNAME,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    AI_AGENT_BACKEND_URL: process.env.AI_AGENT_BACKEND_URL,
    WORDPRESS_DOCKER_REGISTRY: process.env.WORDPRESS_DOCKER_REGISTRY
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
