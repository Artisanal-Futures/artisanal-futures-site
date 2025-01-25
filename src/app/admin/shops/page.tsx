import { api } from '~/trpc/server'
import { AdminClientLayout } from '../_components/client-layout'
import { ShopClient } from './_components/shop-client'

export const metadata = {
  title: 'Shops',
}

export default async function ShopsAdminPage() {
  const shops = await api.shop.getAll()

  return (
    <AdminClientLayout currentPage="Shops" title="Shops">
      <ShopClient shops={shops} />
    </AdminClientLayout>
  )
}
