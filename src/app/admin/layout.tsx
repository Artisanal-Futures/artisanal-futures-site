import { redirect } from 'next/navigation'

import { env } from '~/env'
import { getServerAuthSession } from '~/server/auth'
import AdminPanelLayout from './_components/admin-panel/admin-panel-layout'

type Props = {
  searchParams?: { token?: string }
  children: React.ReactNode
}

export default async function AdminLayout(props: Props) {
  const session = await getServerAuthSession()

  if (!session?.user) {
    redirect(
      `/auth/sign-in?callbackUrl=${encodeURIComponent(
        `${env.NEXTAUTH_URL}/admin`,
      )}`,
    )
  }

  if (session?.user?.role !== 'ADMIN') {
    redirect(`/unauthorized`)
  }

  return <AdminPanelLayout>{props.children}</AdminPanelLayout>
}
