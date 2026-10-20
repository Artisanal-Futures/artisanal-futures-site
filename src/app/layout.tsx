import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import { isIndexingAllowed, SITE_URL } from "~/lib/seo/site";
import { getSiteSettings } from "~/server/seo/settings";
import { TRPCReactProvider } from "~/trpc/react";
import { SiteProviders } from "~/providers/providers";

export async function generateMetadata(): Promise<Metadata> {
  // Editable at /admin/seo; falls back to the built-in defaults.
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: settings.siteName,
    title: {
      template: `%s – ${settings.siteName}`,
      default: settings.defaultTitle ?? settings.siteName,
    },
    description: settings.defaultDescription,
    // Icons come from the file conventions (app/favicon.ico, app/icon.png,
    // app/apple-icon.png). Declaring `icons` here would make Next ignore them.
    openGraph: {
      siteName: settings.siteName,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      ...(settings.twitterHandle ? { site: settings.twitterHandle } : {}),
    },
    // Search Console / Bing Webmaster ownership tags.
    verification: {
      ...(settings.googleVerification
        ? { google: settings.googleVerification }
        : {}),
      ...(settings.bingVerification
        ? { other: { "msvalidate.01": settings.bingVerification } }
        : {}),
    },
    // Dev/staging never get indexed; only SEO_ALLOW_INDEXING=true (prod) does.
    robots: isIndexingAllowed()
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

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
