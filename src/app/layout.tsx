import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ModalProvider } from "~/providers/modal-provider";
import { Providers } from "~/providers/providers";
import { ThemeProvider } from "~/providers/theme-provider";
import NextTopLoader from "nextjs-toploader";

import { Toaster } from "@dreamwalker-studios/toasts";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: {
    template: "%s - Artisanal Futures",
    default: "Artisanal Futures",
  },
  description:
    "Shop worker-owned stores, share knowledge and tech, & participate in the transition to a decolonized circular economy.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Providers>
            <TRPCReactProvider>
              <NextTopLoader />
              {children}
              <Toaster />
              <ModalProvider />
            </TRPCReactProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
