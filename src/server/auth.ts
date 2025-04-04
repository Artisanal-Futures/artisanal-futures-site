/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { DefaultSession, NextAuthOptions } from "next-auth";
import { type NextRequest } from "next/server";
import { db } from "~/server/db";
import { getServerSession } from "next-auth";
import { type Adapter } from "next-auth/adapters";
import Auth0Provider from "next-auth/providers/auth0";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { type Role } from "@prisma/client";

import { env } from "~/env";

const useSecureCookies = env.NEXTAUTH_URL.startsWith("https://");
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

const hostName = !useSecureCookies
  ? new URL(env.NEXTAUTH_URL).hostname
  : env.HOSTNAME;

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties

      role: Role;
      username?: string;
    } & DefaultSession["user"];
  }

  interface User {
    // ...other properties

    role: Role;
    username?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const generateAuthOptions = (req?: NextRequest): NextAuthOptions => {
  return {
    callbacks: {
      session: ({ session, user }) => ({
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role: user.role,
          username: user.username,
        },
      }),

      async signIn(props) {
        const { user } = props;

        // No account, tries to sign in
        const authUser = await db.user.findUnique({
          where: { id: user.id },
        });

        if (!authUser) {
          const code = req?.cookies.get("code")?.value;

          if (process.env.NEXT_PUBLIC_PASSWORD_PROTECT === code) return true;

          // Otherwise, restrict access
          return "/auth/sign-in?error=account-not-found";
        }

        return true;
      },

      redirect({ url, baseUrl }) {
        // Allows relative callback URLs
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        // Allows callback URLs on the same origin
        else if (new URL(url).origin === baseUrl) return url;
        // Allow redirects to env.HOSTNAME
        else if (new URL(url).hostname === env.HOSTNAME) return url;
        return baseUrl;
      },
    },

    adapter: PrismaAdapter(db) as Adapter,
    // session: { strategy: 'jwt' },

    providers: [
      DiscordProvider({
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "select_account", // Changed from 'consent' to 'select_account'
            access_type: "offline",
            response_type: "code",
            // Add these parameters:
            include_granted_scopes: true,
            scope: "openid email profile",
          },
        },
      }),
      Auth0Provider({
        clientId: env.AUTH0_CLIENT_ID,
        clientSecret: env.AUTH0_CLIENT_SECRET,
        issuer: env.AUTH0_ISSUER,
        authorization: {
          params: {
            prompt: "login",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
      /**
       * ...add more providers here.
       *
       * Most other providers require a bit more work than the Discord provider. For example, the
       * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
       * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
       *
       * @see https://next-auth.js.org/providers/github
       */
    ],
    pages: {
      signIn: "/auth/sign-in",
      error: "/auth/sign-in/?errors=invalid-credentials",
      newUser: env.NEXT_PUBLIC_IS_GUEST_ONBOARDING
        ? "/guest-welcome"
        : "/artisan-welcome",
    },
    cookies: {
      sessionToken: {
        name: `${cookiePrefix}next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          domain: "." + hostName,
          secure: useSecureCookies,
        },
      },
      // callbackUrl: {
      //   name: `${cookiePrefix}next-auth.callback-url`,
      //   options: {
      //     sameSite: 'lax',
      //     path: '/',
      //     domain: '.' + hostName,
      //     secure: useSecureCookies,
      //   },
      // },
      csrfToken: {
        name: `${cookiePrefix}next-auth.csrf-token`,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          domain: "." + hostName,
          secure: useSecureCookies,
        },
      },
    },
  };
};

export const authOptions = generateAuthOptions();
/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
