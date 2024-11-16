import AdminLayout from '~/apps/admin/admin-layout'
import { env } from '~/env'
import { getServerAuthSession } from '~/server/auth'

import { redirect } from 'next/navigation'

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

  if (session?.user?.role !== 'ADMIN') {
    redirect(`/unauthorized`)
  }

  return <AdminLayout>{props.children}</AdminLayout>
}
