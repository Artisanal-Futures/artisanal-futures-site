import dynamic from 'next/dynamic'

import ProfileCard from '~/app/(site)/shops/_components/profile-card'
import { api } from '~/trpc/server'

const ArtisanProductsGrid = dynamic(
  () => import('~/app/(site)/shops/_components/artisan-products-grid'),
  { ssr: false },
)

type Props = {
  params: { shopId: string }
}

export const metadata = {
  title: 'Artisan Profile',
  description: 'The profile page for an artisan',
}

export default async function ProfilePage({ params }: Props) {
  const shop = await api.shops.getShopById({
    id: params?.shopId,
  })

  return (
    <>
      <ProfileCard className="mx-auto h-full " {...shop} />

      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Products
      </h2>
      <ArtisanProductsGrid shopName={shop?.shopName} />
    </>
  )
}
