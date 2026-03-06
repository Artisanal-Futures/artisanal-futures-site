import { HydrateClient } from "~/trpc/server";
import { SiteFooter } from "~/components/layout/site-footer";
import { SiteNavbar } from "~/components/layout/site-navbar";
import CookieConsent from "~/components/cookie-banner";

type Props = { children: React.ReactNode };

export default async function SiteLayout({ children }: Props) {
  return (
    <HydrateClient>
      <main className="bg-background flex min-h-screen flex-col">
        <SiteNavbar />
        {children}
        <SiteFooter />
      </main>
      <CookieConsent />
    </HydrateClient>
  );
}
