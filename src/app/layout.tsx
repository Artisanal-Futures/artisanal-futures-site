import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { TRPCReactProvider } from "~/trpc/react";
import { SiteProviders } from "~/providers/providers";

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
        <SiteProviders>
          <TRPCReactProvider>
            <NextTopLoader />
            {children}
          </TRPCReactProvider>
        </SiteProviders>
      </body>
    </html>
  );
}
