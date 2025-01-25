import type { Shop } from '@prisma/client'
import Link from 'next/link'

import ShopCard from '~/app/(site)/shops/_components/shop-card'
import { api } from '~/trpc/server'

export const metadata = {
  title: 'Shops',
  description: 'Browse our featured artisans&apos; stores',
}

export default async function ShopsPage() {
  const shops = await api.shop.getAllValidShops()

  return (
    <>
      <h1 className="text-4xl font-semibold">Shops</h1>
      <p className="mb-3 mt-2 text-xl text-muted-foreground">
        Browse our featured artisans&apos; stores
      </p>

      {shops?.length === 0 && (
        <p className="my-auto text-xl text-muted-foreground">
          Well, this is unfortunate. We don&apos;t have any shops set up at the
          moment. If you are registered, you can create your shop,{' '}
          <Link
            href="/profile/shop"
            className=" font-semibold text-slate-800  hover:text-slate-800/50"
          >
            here
          </Link>
          .
        </p>
      )}
      {shops?.length !== 0 && (
        <div className="flex h-fit w-full flex-col md:flex-row md:flex-wrap">
          {shops?.map((artisan: Shop) => (
            <ShopCard
              {...artisan}
              className="flex basis-full p-4 md:basis-1/2 lg:basis-1/4 "
              key={artisan.id}
            />
          ))}
        </div>
      )}
    </>
  )
}
