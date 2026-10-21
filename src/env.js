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

    RESEND_API_KEY: z.string(),

    AI_AGENT_BACKEND_URL: z.string().url(),

    MINIO_ACCESS_KEY: z.string(),
    MINIO_SECRET_KEY: z.string(),
    MINIO_ENDPOINT: z.string(),

    STRIPE_SECRET_KEY: z.string(),

    COOLIFY_ADMIN_SAFE_API_TOKEN: z.string().min(1),
    COOLIFY_API: z.string().url(),
    COOLIFY_UUID: z.string().min(1),
    WORDPRESS_DOCKER_REGISTRY: z.string().min(1),

    // SimplePress integration
    SIMPLEPRESS_API_URL: z.string().url(),
    SIMPLEPRESS_API_TOKEN: z.string().min(1),
    SIMPLEPRESS_CALLBACK_TOKEN: z.string().min(1),
    AF_SP_WEBHOOK_SECRET: z.string().min(1),
    // Optional link to the SimplePress welcome guide (e.g. a Google Doc),
    // included in the website-ready email when set.
    SIMPLEPRESS_WELCOME_GUIDE_URL: z.string().url().optional(),
    // DEPRECATED: replaced by SIMPLEPRESS_CALLBACK_TOKEN + AF_SP_WEBHOOK_SECRET; remove at cutover
    SIMPLEPRESS_HASH_SECRET: z.string().min(1),

    // Google reCAPTCHA v3 secret + minimum accepted score (0-1).
    RECAPTCHA_SECRET_KEY: z.string(),
    RECAPTCHA_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.5),

    // Bearer token for POST /api/cron/sync-products, called by the Coolify
    // Scheduled Task that runs the weekly product sync. Generate with
    // `openssl rand -hex 32`.
    //
    // Optional so a deploy never fails just because the secret hasn't been
    // added in Coolify yet — the route returns 503 until it is set, rather
    // than the whole build refusing to start. When present it must be long
    // enough to be worth having.
    CRON_SECRET: z.string().min(32).optional(),

    // IndexNow key, served at /indexnow-key.txt so Bing (and the engines it
    // feeds), Yandex and Seznam can verify pings. Generate with
    // `openssl rand -hex 16`. Only needed in production: unset means no pings.
    INDEXNOW_KEY: z
      .string()
      .regex(/^[a-zA-Z0-9-]{8,128}$/)
      .optional(),

    // Master switch for search-engine indexing. Defaults to false so dev and
    // staging deployments are never indexed; set to "true" in production only.
    // It drives robots.txt and the site-wide robots meta tag.
    // Unset = index only when BETTER_AUTH_URL is the production domain (see
    // src/lib/seo/site.ts), so forgetting it can't deindex prod or index dev.
    SEO_ALLOW_INDEXING: z.preprocess(
      (str) =>
        str === undefined || str === "" ? undefined : str === "true" || str === true,
      z.boolean().optional(),
    ),
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
    NEXT_PUBLIC_STORAGE_BUCKET_NAME: z.string().min(1),
    NEXT_PUBLIC_EMAIL_FROM_NOREPLY: z.string(),
    NEXT_PUBLIC_EMAIL_FROM_SUPPORT: z.string(),
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string(),

    NEXT_PUBLIC_HELP_DOCS_URL: z.string(),
    // Base URL of the UPCY generator app (no trailing slash).
    NEXT_PUBLIC_UPCY_URL: z.string().url(),

    // Canonical origin of this deployment (no trailing slash needed). Optional
    // so a deploy never fails if it isn't set; src/lib/seo/site-url.ts falls
    // back to the production domain.
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
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
    HOSTNAME: process.env.HOSTNAME,

    COOLIFY_API: process.env.COOLIFY_API,
    COOLIFY_ADMIN_SAFE_API_TOKEN: process.env.COOLIFY_ADMIN_SAFE_API_TOKEN,
    COOLIFY_UUID: process.env.COOLIFY_UUID,
    WORDPRESS_DOCKER_REGISTRY: process.env.WORDPRESS_DOCKER_REGISTRY,

    SIMPLEPRESS_API_URL: process.env.SIMPLEPRESS_API_URL,
    SIMPLEPRESS_API_TOKEN: process.env.SIMPLEPRESS_API_TOKEN,
    SIMPLEPRESS_CALLBACK_TOKEN: process.env.SIMPLEPRESS_CALLBACK_TOKEN,
    SIMPLEPRESS_WELCOME_GUIDE_URL: process.env.SIMPLEPRESS_WELCOME_GUIDE_URL,
    AF_SP_WEBHOOK_SECRET: process.env.AF_SP_WEBHOOK_SECRET,
    SIMPLEPRESS_HASH_SECRET: process.env.SIMPLEPRESS_HASH_SECRET,

    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,

    RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY,
    RECAPTCHA_MIN_SCORE: process.env.RECAPTCHA_MIN_SCORE,
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,

    CRON_SECRET: process.env.CRON_SECRET,
    INDEXNOW_KEY: process.env.INDEXNOW_KEY,
    SEO_ALLOW_INDEXING: process.env.SEO_ALLOW_INDEXING,

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

    NEXT_PUBLIC_HELP_DOCS_URL: process.env.NEXT_PUBLIC_HELP_DOCS_URL,
    NEXT_PUBLIC_UPCY_URL: process.env.NEXT_PUBLIC_UPCY_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
