import type { Role } from '@prisma/client'
import { redirect } from 'next/navigation'

import { getServerAuthSession } from '~/server/auth'

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerAuthSession()

  if (!session) redirect('/unauthorized')

  const authorizedRoles: Role[] = ['ADMIN', 'ARTISAN']

  if (!authorizedRoles.includes(session?.user?.role)) redirect('/unauthorized')

  return <>{children}</>
}
