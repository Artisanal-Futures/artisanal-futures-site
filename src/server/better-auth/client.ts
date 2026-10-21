import {
  genericOAuthClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "./config";
import { executeRecaptcha } from "~/lib/captcha/use-recaptcha-v3";

// Endpoints whose requests need a reCAPTCHA v3 token (the server-side captcha
// plugin checks `x-captcha-response`). Action names may only contain letters,
// digits, `/` and `_`. Sign-up is handled by the invite forms, which send the
// token through /api/auth/sign-up-with-invite.
const CAPTCHA_ACTIONS: Record<string, string> = {
  "/sign-in/email": "signin",
  "/request-password-reset": "password_reset",
};

// No `baseURL`: this module ships to the browser, and BETTER_AUTH_URL is a
// server-only var (no NEXT_PUBLIC_ prefix), so Next.js never inlines it here —
// passing it would just set `baseURL: undefined`. Omitting it lets better-auth
// default to the current origin, which is correct for our same-origin
// /api/auth routes and avoids exposing the URL as a public env var.
//
// reCAPTCHA tokens are attached here, in the global fetch hook, instead of via
// AuthUIProvider's `captcha` prop: that would wrap the whole app in a
// GoogleReCaptchaProvider (loading Google's script on every page) and misses
// callers outside the auth views, e.g. AccountView's "Set password" card. This
// covers every caller, and the script only loads where a token is needed.
export const authClient = createAuthClient({
  fetchOptions: {
    onRequest: async (context) => {
      if (typeof window === "undefined") return context;
      if (context.headers.has("x-captcha-response")) return context;

      const { pathname } = new URL(String(context.url), window.location.origin);
      const action = Object.entries(CAPTCHA_ACTIONS).find(([suffix]) =>
        pathname.endsWith(suffix),
      )?.[1];
      if (!action) return context;

      const token = await executeRecaptcha(action);
      if (token) context.headers.set("x-captcha-response", token);

      return context;
    },
  },
  plugins: [inferAdditionalFields<typeof auth>(), genericOAuthClient()],
});

export type Session = typeof authClient.$Infer.Session;
