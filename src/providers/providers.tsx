/* eslint-disable @typescript-eslint/unbound-method */
"use client";

import { AuthUIProvider, type ProviderIcon } from "@daveyplate/better-auth-ui";
import { auth0 } from "better-auth/plugins";
import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import type { ReactNode } from "react";

import { IconBrandAuth0 } from "@tabler/icons-react";
import { Toaster } from "~/components/ui/sonner";
import { env } from "~/env";
import { ThemeProvider } from "~/providers/theme-provider";
import { authClient } from "~/server/better-auth/client";

export function SiteProviders({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthUIProvider
        authClient={authClient}
        navigate={router.push}
        replace={router.replace}
        onSessionChange={() => {
          // Clear router cache (protected routes)
          router.refresh();
        }}
        social={{
          providers: ["discord", "google"],
        }}
        genericOAuth={{
          providers: [
            {
              provider: "auth0",
              name: "Auth0",
              icon: IconBrandAuth0,
            },
          ],
        }}
        additionalFields={{
          terms: {
            label: `I agree to Artisanal Futures's Terms of Service and Privacy Policy`,
            type: "boolean", // Defines it as a checkbox
            required: true, // Optional: forces the checkbox to be checked
          },
        }}
        Link={Link}
        captcha={
          process.env.NODE_ENV === "production"
            ? {
                provider: "hcaptcha",
                siteKey: env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
              }
            : undefined
        }
        viewPaths={{
          SIGN_UP: "join",
        }}
      >
        {children}

        <Toaster />
      </AuthUIProvider>
    </ThemeProvider>
  );
}
