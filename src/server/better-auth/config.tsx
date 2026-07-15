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

// Captcha is enforced on sign-up only (see the `endpoints` option below).
// Sign-in and password reset are intentionally captcha-free: this is a closed,
// invite-only platform, so those flows don't render a captcha widget. The
// gate is limited to production where both hCaptcha keys are available, since
// the sign-up captcha token is supplied by the custom invite forms.
const captchaEnabled =
  process.env.NODE_ENV === "production" &&
  !!env.HCAPTCHA_SECRET_KEY &&
  !!env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,

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
          siteName: "SimplePress",
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
            provider: "hcaptcha",
            secretKey: env.HCAPTCHA_SECRET_KEY,
            siteKey: env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
            // Only sign-up is protected; sign-in & password reset are captcha-free.
            endpoints: ["/sign-up/email"],
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
      // Only sent when the current email is verified: better-auth emails the
      // existing address to approve the change. When the current email is
      // unverified (the default here), the new email is applied directly.
      sendChangeEmailVerification: async ({
        user,
        newEmail,
        url,
      }: {
        user: { email: string; name: string };
        newEmail: string;
        url: string;
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
            siteName: "SimplePress",
            baseUrl: env.BETTER_AUTH_URL,
            url,
          }),
        });
      },
    },
    additionalFields: {
      role: {
        type: "string",
      },
      username: {
        type: "string",
        required: false,
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

      if (ctx.path === "/error") {
        const queryString = new URLSearchParams(
          ctx.query as
            | string
            | Record<string, string>
            | string[][]
            | URLSearchParams
            | undefined,
        ).toString();
        throw ctx.redirect(`/auth/error?${queryString}`);
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
