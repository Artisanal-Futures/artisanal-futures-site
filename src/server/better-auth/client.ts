import { inferAdditionalFields, genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./config";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    inferAdditionalFields<typeof auth>(),
    genericOAuthClient(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
