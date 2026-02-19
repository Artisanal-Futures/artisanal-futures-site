import { HydrateClient } from "~/trpc/server";
import CookieConsent from "~/components/cookie-banner";
import Container from "~/app/_components/container";
import Footer from "~/app/_components/footer";
import { Navbar } from "~/app/_components/navbar";

type Props = { children: React.ReactNode };

export default async function SiteLayout({ children }: Props) {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col">
        <Navbar />
        <Container className="flex h-full grow flex-col items-stretch p-8">
          {children}
        </Container>
        <Footer />
      </main>
      <CookieConsent />
    </HydrateClient>
  );
}
