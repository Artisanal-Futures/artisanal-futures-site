import {
  genericOAuthClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "./config";

// No `baseURL`: this module ships to the browser, and BETTER_AUTH_URL is a
// server-only var (no NEXT_PUBLIC_ prefix), so Next.js never inlines it here —
// passing it would just set `baseURL: undefined`. Omitting it lets better-auth
// default to the current origin, which is correct for our same-origin
// /api/auth routes and avoids exposing the URL as a public env var.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), genericOAuthClient()],
});

export type Session = typeof authClient.$Infer.Session;
