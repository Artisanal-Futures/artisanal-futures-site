import { redirect } from 'next/navigation'

import { SidebarNav } from '~/app/(site)/profile/_components/sidebar-nav'
import { Separator } from '~/components/ui/separator'
import { env } from '~/env'
import { getServerAuthSession } from '~/server/auth'
import { api } from '~/trpc/server'

type Props = {
  children: React.ReactNode
}

export default async function ProfileLayout({ children }: Props) {
  const shop = await api.shops.getCurrentUserShop()
  const session = await getServerAuthSession()

  const navItems = [
    {
      title: 'Profile',
      href: '/profile',
    },
    {
      title: 'My Shop',
      href: shop ? `/profile/shop/${shop?.id}` : '/profile/shop',
    },
    {
      title: 'Survey',
      href: '/profile/survey',
    },
  ]

  if (!session) {
    redirect(
      `/auth/sign-in?callbackUrl=${encodeURIComponent(
        `${env.NEXTAUTH_URL}/profile`,
      )}`,
    )
  }

  return (
    <>
      <div className=" block space-y-6 py-5 pb-16">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 ">
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Manage your account settings , shop settings, and update
              preferences.
            </p>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={navItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  )
}
