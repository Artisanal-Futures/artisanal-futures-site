/* eslint-disable @typescript-eslint/unbound-method */
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { useRouter } from "nextjs-toploader/app";

import { env } from "~/env";
import { authClient } from "~/server/better-auth/client";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/providers/theme-provider";

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
      >
        {children}

        <Toaster />
      </AuthUIProvider>
    </ThemeProvider>
  );
}
