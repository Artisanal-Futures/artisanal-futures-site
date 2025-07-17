import { api } from '~/trpc/server'; // Import the server-side tRPC client
import Container from '~/app/_components/container'
import Footer from '~/app/_components/footer'
import Navbar from '~/app/_components/navbar'
import CookieConsent from '~/components/cookie-banner'

type Props = { children: React.ReactNode }

export default async function SiteLayout({ children }: Props) {
  const categories = await api.category.getNavigationTree();

  return (
    <>
      <main className="flex min-h-screen flex-col">
        <Navbar categories={categories} />
        <Container className=" flex h-full flex-grow flex-col items-stretch p-8">
          {children}
        </Container>
        <Footer />
      </main>
      <CookieConsent />
    </>
  )
}
