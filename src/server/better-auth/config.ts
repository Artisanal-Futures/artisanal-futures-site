import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { auth0, genericOAuth } from "better-auth/plugins";

import { env } from "~/env";
import { db } from "~/server/db";

const useSecureCookies = env.BETTER_AUTH_URL.startsWith("https://");
const hostName = !useSecureCookies
  ? new URL(env.BETTER_AUTH_URL).hostname
  : env.HOSTNAME;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,

  trustedOrigins: ["http://localhost:3000", `${env.BETTER_AUTH_URL}`],

  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  socialProviders: {
    discord: {
      clientId: env.BETTER_AUTH_DISCORD_ID,
      clientSecret: env.BETTER_AUTH_DISCORD_SECRET,
      redirectURI: `${env.BETTER_AUTH_URL}/api/auth/callback/discord`,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${env.BETTER_AUTH_URL}/api/auth/callback/google`,
    },
  },

  plugins: [
    genericOAuth({
      config: [
        auth0({
          clientId: env.AUTH0_CLIENT_ID,
          clientSecret: env.AUTH0_CLIENT_SECRET,
          domain: env.AUTH0_ISSUER.replace("https://", ""),
        }),
      ],
    }),
  ],

  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: hostName,
    },
  },

  user: {
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
      // 1. ENFORCE PLATFORM INVITE ON EMAIL/PASSWORD SIGN-UP
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

      // 2. STORE INVITE CODE FOR OAUTH FLOWS
      if (ctx.path === "/sign-in/social") {
        const code = ctx.query?.code as string | undefined;

        if (code) {
          await ctx.setSignedCookie(
            "signup-code",
            code.trim().toUpperCase(),
            ctx.context.secret,
            {
              maxAge: 600, // 10 minutes
              httpOnly: true,
              sameSite: "lax",
            },
          );
        }
      }
    }),

    after: createAuthMiddleware(async (ctx) => {
      // 3. VALIDATE NEW OAUTH USERS HAVE PLATFORM INVITE
      if (
        ctx.path.startsWith("/callback/discord") ||
        ctx.path.startsWith("/callback/google") ||
        ctx.path.startsWith("/callback/auth0")
      ) {
        const user = ctx.context.newSession?.user;
        if (!user) return;

        const existingUser = await db.user.findUnique({
          where: { id: user.id },
          select: { createdAt: true },
        });

        const isNewUser =
          existingUser && Date.now() - existingUser.createdAt.getTime() < 5000;

        if (isNewUser) {
          const code = await ctx.getSignedCookie(
            "signup-code",
            ctx.context.secret,
          );

          if (!code) {
            await db.user.delete({ where: { id: user.id } });
            throw new APIError("UNAUTHORIZED", {
              message:
                "New accounts require an invitation code. Please visit the sign-up page with a valid code.",
            });
          }

          const invite = await db.platformInvite.findUnique({
            where: { code },
          });

          if (!invite) {
            await db.user.delete({ where: { id: user.id } });
            throw new APIError("UNAUTHORIZED", {
              message: "Invalid invitation code",
            });
          }

          if (invite.used) {
            await db.user.delete({ where: { id: user.id } });
            throw new APIError("UNAUTHORIZED", {
              message: "This invitation code has already been used",
            });
          }

          if (invite.expiresAt <= new Date()) {
            await db.user.delete({ where: { id: user.id } });
            throw new APIError("UNAUTHORIZED", {
              message: "This invitation code has expired",
            });
          }

          const userEmail = user.email?.trim().toLowerCase();
          if (invite.email.toLowerCase() !== userEmail) {
            await db.user.delete({ where: { id: user.id } });
            throw new APIError("UNAUTHORIZED", {
              message: "This invitation is for a different email address.",
            });
          }

          ctx.setCookie("signup-code", "", { maxAge: 0 });
        }
      }

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
