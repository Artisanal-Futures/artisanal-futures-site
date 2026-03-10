import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    // Add `.min(1) on ID and SECRET if you want to make sure they're not empty

    BETTER_AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    BETTER_AUTH_DISCORD_ID: z.string(),
    BETTER_AUTH_DISCORD_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    AUTH0_CLIENT_ID: z.string().min(1),
    AUTH0_CLIENT_SECRET: z.string().min(1),
    AUTH0_ISSUER: z.string().min(1),
    HOSTNAME: z.string(),
    GUEST_CODE: z.string(),
    ARTISAN_CODE: z.string(),

    RESEND_API_KEY: z.string(),

    AI_AGENT_BACKEND_URL: z.string().url(),

    MINIO_ACCESS_KEY: z.string(),
    MINIO_SECRET_KEY: z.string(),
    MINIO_ENDPOINT: z.string(),

    STRIPE_PUBLISHABLE_KEY: z.string(),
    STRIPE_SECRET_KEY: z.string(),

    COOLIFY_ADMIN_SAFE_API_TOKEN: z.string().min(1),
    COOLIFY_API: z.string().url(),
    COOLIFY_UUID: z.string().min(1),
    WORDPRESS_DOCKER_REGISTRY: z.string().min(1),
    SIMPLEPRESS_HASH_SECRET: z.string().min(1),

    HCAPTCHA_SECRET_KEY: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
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

    NEXT_PUBLIC_PASSWORD_PROTECT: z.string().min(1),
    NEXT_PUBLIC_STORAGE_BUCKET_NAME: z.string().min(1),
    NEXT_PUBLIC_EMAIL_FROM_NOREPLY: z.string(),
    NEXT_PUBLIC_EMAIL_FROM_SUPPORT: z.string(),
    NEXT_PUBLIC_HCAPTCHA_SITE_KEY: z.string(),

    NEXT_PUBLIC_HELP_DOCS_URL: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    AI_AGENT_BACKEND_URL: process.env.AI_AGENT_BACKEND_URL,

    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_DISCORD_ID: process.env.BETTER_AUTH_DISCORD_ID,
    BETTER_AUTH_DISCORD_SECRET: process.env.BETTER_AUTH_DISCORD_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_ISSUER: process.env.AUTH0_ISSUER,
    NEXT_PUBLIC_PASSWORD_PROTECT: process.env.NEXT_PUBLIC_PASSWORD_PROTECT,
    HOSTNAME: process.env.HOSTNAME,
    GUEST_CODE: process.env.GUEST_CODE,
    ARTISAN_CODE: process.env.ARTISAN_CODE,

    COOLIFY_API: process.env.COOLIFY_API,
    COOLIFY_ADMIN_SAFE_API_TOKEN: process.env.COOLIFY_ADMIN_SAFE_API_TOKEN,
    COOLIFY_UUID: process.env.COOLIFY_UUID,
    WORDPRESS_DOCKER_REGISTRY: process.env.WORDPRESS_DOCKER_REGISTRY,
    SIMPLEPRESS_HASH_SECRET: process.env.SIMPLEPRESS_HASH_SECRET,

    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,

    HCAPTCHA_SECRET_KEY: process.env.HCAPTCHA_SECRET_KEY,
    NEXT_PUBLIC_HCAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,

    NEXT_PUBLIC_STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL,
    NEXT_PUBLIC_STORAGE_BUCKET_NAME:
      process.env.NEXT_PUBLIC_STORAGE_BUCKET_NAME,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,

    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_EMAIL_FROM_NOREPLY: process.env.NEXT_PUBLIC_EMAIL_FROM_NOREPLY,
    NEXT_PUBLIC_EMAIL_FROM_SUPPORT: process.env.NEXT_PUBLIC_EMAIL_FROM_SUPPORT,

    NEXT_PUBLIC_VOTE_DISABLED: process.env.NEXT_PUBLIC_VOTE_DISABLED,
    NEXT_PUBLIC_HEART_VOTE_DISABLED:
      process.env.NEXT_PUBLIC_HEART_VOTE_DISABLED,
    NEXT_PUBLIC_NEGATIVE_VOTE_DISABLED:
      process.env.NEXT_PUBLIC_NEGATIVE_VOTE_DISABLED,

    NEXT_PUBLIC_HELP_DOCS_URL: process.env.NEXT_PUBLIC_HELP_DOCS_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
