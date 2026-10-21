import { EmailTemplate } from "@daveyplate/better-auth-ui/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { auth0, captcha, genericOAuth } from "better-auth/plugins";

import { env } from "~/env";
import { resend } from "~/lib/email/resend";
import { EMAIL_FROM } from "~/lib/email/send";
import { db } from "~/server/db";

const useSecureCookies = env.BETTER_AUTH_URL.startsWith("https://");
const hostName = !useSecureCookies
  ? new URL(env.BETTER_AUTH_URL).hostname
  : env.HOSTNAME;

// Captcha guards sign-up, email sign-in and password-reset requests (the
// plugin's default endpoints). Tokens are minted invisibly by reCAPTCHA v3:
// sign-up by the invite forms, sign-in and reset by the auth client's
// `onRequest` hook (see client.ts). The gate is limited to production where
// both reCAPTCHA keys are available.
const captchaEnabled =
  process.env.NODE_ENV === "production" &&
  !!env.RECAPTCHA_SECRET_KEY &&
  !!env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,

  onAPIError: {
    errorURL: "/auth/error",
  },

  trustedOrigins: ["http://localhost:3000", `${env.BETTER_AUTH_URL}`],

  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      void resend.emails.send({
        from: EMAIL_FROM.NOREPLY,
        to: user.email,
        subject: "Reset your password",
        // html: `Click the link to reset your password: ${url}`,
        react: EmailTemplate({
          action: "Reset Password",
          heading: "Reset Password",
          content: (
            <>
              <p>{`Hello ${user.name},`}</p>
              <p>Click the button below to reset your password.</p>
            </>
          ),
          siteName: "Artisanal Futures",
          baseUrl: env.BETTER_AUTH_URL,
          url,
        }),
      });
    },
  },

  socialProviders: {
    discord: {
      clientId: env.BETTER_AUTH_DISCORD_ID,
      clientSecret: env.BETTER_AUTH_DISCORD_SECRET,
      redirectURI: `${env.BETTER_AUTH_URL}/api/auth/callback/discord`,
      disableImplicitSignUp: true,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${env.BETTER_AUTH_URL}/api/auth/callback/google`,
      disableImplicitSignUp: true,
      prompt: "select_account",
    },
  },
  plugins: [
    genericOAuth({
      config: [
        auth0({
          clientId: env.AUTH0_CLIENT_ID,
          clientSecret: env.AUTH0_CLIENT_SECRET,
          domain: env.AUTH0_ISSUER.replace("https://", ""),
          redirectURI: `${env.BETTER_AUTH_URL}/api/auth/callback/auth0`,
          disableImplicitSignUp: true,
        }),
      ],
    }),

    ...(captchaEnabled
      ? [
          captcha({
            provider: "google-recaptcha",
            secretKey: env.RECAPTCHA_SECRET_KEY,
            minScore: env.RECAPTCHA_MIN_SCORE,
            // Default endpoints: /sign-up/email, /sign-in/email and
            // /request-password-reset (HTTP requests only; `auth.api.*` server
            // calls are not checked).
          }),
        ]
      : []),
  ],

  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: hostName,
    },
  },

  user: {
    changeEmail: {
      enabled: true,
      // If the user's current email is unverified, the change is applied
      // directly (no confirmation email). If it's verified, better-auth
      // calls this to send a confirmation link to the *current* address
      // before applying the change to newEmail.
      updateEmailWithoutVerification: true,
      sendChangeEmailConfirmation: async ({
        user,
        newEmail,
        url,
      }: {
        user: { email: string; name: string };
        newEmail: string;
        url: string;
        token?: string;
      }) => {
        void resend.emails.send({
          from: EMAIL_FROM.NOREPLY,
          to: user.email,
          subject: "Approve your email change",
          react: EmailTemplate({
            action: "Approve Email Change",
            heading: "Confirm your new email",
            content: (
              <>
                <p>{`Hello ${user.name},`}</p>
                <p>{`Click the button below to change your account email to ${newEmail}. If you didn't request this, you can ignore this message.`}</p>
              </>
            ),
            siteName: "Artisanal Futures",
            baseUrl: env.BETTER_AUTH_URL,
            url,
          }),
        });
      },
    },
    additionalFields: {
      role: {
        type: "string",
        // Never accept a role from client input (sign-up or update-user).
        // Invite sign-ups get their role assigned server-side in
        // `databaseHooks.user.create.before` below.
        input: false,
        defaultValue: "GUEST",
      },
      username: {
        type: "string",
        required: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          // Assign the role from the invite validated in `hooks.before`.
          if (ctx?.path !== "/sign-up/email") return;
          const body = ctx.body as { code?: string } | undefined;
          const code = body?.code?.trim().toUpperCase();
          if (!code) return;

          const invite = await db.platformInvite.findUnique({
            where: { code },
            select: { role: true },
          });
          if (!invite) return;

          return { data: { ...user, role: invite.role } };
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const body = ctx.body as { code?: string; email?: string };
        const code = body?.code?.trim().toUpperCase();
        const email = body?.email?.trim().toLowerCase();

        if (!code) {
          throw new APIError("UNAUTHORIZED", {
            message: "Invalid or missing invitation code",
          });
        }

        const invite = await db.platformInvite.findUnique({
          where: { code },
        });

        if (!invite) {
          throw new APIError("UNAUTHORIZED", {
            message: "Invalid invitation code",
          });
        }

        if (invite.used) {
          throw new APIError("UNAUTHORIZED", {
            message: "This invitation code has already been used",
          });
        }

        if (invite.expiresAt <= new Date()) {
          throw new APIError("UNAUTHORIZED", {
            message: "This invitation code has expired",
          });
        }

        if (invite.email.toLowerCase() !== email) {
          throw new APIError("UNAUTHORIZED", {
            message: "This invitation is for a different email address.",
          });
        }
      }

      return ctx;
    }),

    after: createAuthMiddleware(async (ctx) => {
      // 4. CUSTOM REDIRECTS (allow env.HOSTNAME redirects)
      if (
        (ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/callback")) &&
        ctx.context.newSession
      ) {
        const callbackUrl = ctx.query?.callbackURL as string | undefined;
        if (callbackUrl) {
          try {
            const url = new URL(callbackUrl, env.BETTER_AUTH_URL);
            // Allow redirects to same origin or HOSTNAME
            if (
              url.origin === env.BETTER_AUTH_URL ||
              url.hostname === env.HOSTNAME
            ) {
              throw ctx.redirect(callbackUrl);
            }
          } catch {
            // Invalid URL, ignore and use default
          }
        }
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
