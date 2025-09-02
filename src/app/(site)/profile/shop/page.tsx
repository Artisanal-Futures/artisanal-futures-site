import { redirect } from 'next/navigation'

import { Separator } from '~/components/ui/separator'
import { api } from '~/trpc/server'
import { ShopModalTrigger } from '../_components/shop-modal-trigger'

export const metadata = {
  title: 'New Shop',
}
export default async function ProfileShopPage() {
  const shop = await api.shop.getCurrentUserShop()

  if (shop) {
    redirect(`/profile/shop/${shop.id}`)
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Shop Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Configure how your store is shown to visitors
          </p>
        </div>
        <Separator />
        <p>
          You currently don&apos;t have a shop setup yet. Create one to promote
          your business to visitors on the site!
        </p>

        <ShopModalTrigger />
      </div>
    </>
  )
}
