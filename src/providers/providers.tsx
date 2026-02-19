/* eslint-disable @typescript-eslint/unbound-method */
"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";

import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { authClient } from "~/server/better-auth/client";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    // <ThemeProvider
    //   attribute="class"
    //   defaultTheme="system"
    //   enableSystem
    //   disableTransitionOnChange
    // >
    <AuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => {
        // Clear router cache (protected routes)
        router.refresh();
      }}
      social={{
        providers: ["discord"],
      }}
      signUp={{
        fields: ["terms"],
      }}
      additionalFields={{
        terms: {
          label: `I agree to CCA's Terms of Service and Privacy Policy`,
          type: "boolean", // Defines it as a checkbox
          required: true, // Optional: forces the checkbox to be checked
        },
      }}
      Link={Link}
    >
      {children}

      <Toaster />
    </AuthUIProvider>
    // </ThemeProvider>
  );
}
