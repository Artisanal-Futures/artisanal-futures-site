import Container from '~/app/_components/container'
import Footer from '~/app/_components/footer'
import Navbar from '~/app/_components/navbar'
import CookieConsent from '~/components/cookie-banner'
import { api } from '~/trpc/server'
import { CategoryType } from '@prisma/client'

type Props = {
  children: React.ReactNode
}

export default async function SiteLayout({ children }: Props) {
  const productCategories = await api.category.getNavigationTree({ type: CategoryType.PRODUCT });
  const serviceCategories = await api.category.getNavigationTree({ type: CategoryType.SERVICE });
  
  return (
    <>
      <main className="flex min-h-screen flex-col">
        <Navbar productCategories={productCategories} serviceCategories={serviceCategories} />
        <Container className=" flex h-full flex-grow flex-col items-stretch p-8">
          {children}
        </Container>
        <Footer />
      </main>
      <CookieConsent />
    </>
  )
}