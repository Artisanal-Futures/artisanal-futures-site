import { redirect } from 'next/navigation'

import { getServerAuthSession } from '~/server/auth'
import { api } from '~/trpc/server'

export default async function DepotLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { depotId: string }
}) {
  const session = await getServerAuthSession()
  const user = session?.user

  if (!user) {
    return redirect('/tools/solidarity-pathways/sandbox')
  }

  if (user.role === 'DRIVER') {
    return redirect('/tools/solidarity-pathways/sandbox')
  }

  const depot = await api.depots.getDepot({ depotId: params.depotId })

  if (!depot) {
    return redirect('/tools/solidarity-pathways')
  }

  const isOwner = user.id === depot.ownerId

  if (!isOwner) {
    return redirect('/tools/solidarity-pathways/sandbox')
  }

  return <>{children}</>
}
