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
      // 1. ENFORCE PASSCODE ON EMAIL/PASSWORD SIGN-UP
      if (ctx.path === "/sign-up/email") {
        const code = (ctx.body as { code: string | undefined })?.code;

        if (code !== process.env.NEXT_PUBLIC_PASSWORD_PROTECT) {
          throw new APIError("UNAUTHORIZED", {
            message: "Invalid or missing sign-up code",
          });
        }
      }

      // 2. STORE PASSCODE FOR OAUTH FLOWS
      if (ctx.path === "/sign-in/social") {
        const code = ctx.query?.code as string | undefined;

        if (code) {
          // Store validated code in signed cookie for OAuth callback
          await ctx.setSignedCookie("signup-code", code, ctx.context.secret, {
            maxAge: 600, // 10 minutes
            httpOnly: true,
            sameSite: "lax",
          });
        }
      }
    }),

    after: createAuthMiddleware(async (ctx) => {
      // 3. VALIDATE NEW OAUTH USERS HAVE PASSCODE
      if (
        ctx.path.startsWith("/callback/discord") ||
        ctx.path.startsWith("/callback/google") ||
        ctx.path.startsWith("/callback/auth0")
      ) {
        const user = ctx.context.newSession?.user;
        if (!user) return;

        // Check if this is a NEW user (just created, createdAt within last 5 seconds)
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

          if (code !== process.env.NEXT_PUBLIC_PASSWORD_PROTECT) {
            // Delete the newly created user
            await db.user.delete({ where: { id: user.id } });
            throw new APIError("UNAUTHORIZED", {
              message:
                "New accounts require a sign-up code. Please visit /auth/sign-up with a valid code.",
            });
          }

          // Clear the code cookie after successful sign-up
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
