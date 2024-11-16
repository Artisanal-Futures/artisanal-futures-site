import { RecentMembers } from '~/apps/admin/components/recent-members'
import { SiteVisitorOverview } from '~/apps/admin/components/site-visitor-overview'
import StatBar from '~/apps/admin/components/stat-bar'
import { Heading } from '~/components/ui/heading'
import { Separator } from '~/components/ui/separator'
import { api } from '~/trpc/server'

export const metadata = {
  title: 'Admin Dashboard',
}

export default async function AdminPage() {
  const shops = await api.shops.getAllShops()
  const users = await api.user.getAllUsers()
  const products = await api.products.getAllProducts()

  const statData = [
    {
      title: 'Number of Members',
      metric: users?.length ?? 0,
    },
    {
      title: 'Active Shops',
      metric: shops?.length ?? 0,
    },
    {
      title: 'Products',
      metric: products?.products?.length ?? 0,
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading
          title="Admin Dashboard"
          description="Stats and misc info on Artisanal Futures at a glance"
        />
        <Separator />
        <StatBar stats={statData} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <SiteVisitorOverview />
          <RecentMembers members={users ?? []} isLoading={false} />
        </div>
      </div>
    </div>
  )
}
