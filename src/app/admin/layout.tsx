import { redirect } from 'next/navigation'

import { env } from '~/env'
import { getServerAuthSession } from '~/server/auth'
import SidebarWrapper from './_components/sidebar-wrapper'

type Props = {
  searchParams?: { token?: string }
  children: React.ReactNode
}

export default async function AdminPanelLayout(props: Props) {
  const session = await getServerAuthSession()

  if (!session?.user) {
    redirect(
      `/auth/sign-in?callbackUrl=${encodeURIComponent(
        `${env.NEXTAUTH_URL}/admin`,
      )}`,
    )
  }

  if (session?.user?.role === 'USER') {
    redirect(`/unauthorized`)
  }

  return <SidebarWrapper>{props.children}</SidebarWrapper>
}
