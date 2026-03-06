import { SiteFooter } from "~/components/layout/site-footer";
import { SiteNavbar } from "~/components/layout/site-navbar";
import CookieConsent from "~/components/cookie-banner";

type Props = { children: React.ReactNode };

export default function SiteLayout({ children }: Props) {
  return (
    <>
      <main className="flex min-h-screen flex-col">
        <SiteNavbar />
        <div className="page-container">{children}</div>
        <SiteFooter />
      </main>
      <CookieConsent />
    </>
  );
}
