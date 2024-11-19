import { api } from '~/trpc/server'
import AdminClientLayout from '../../_components/layout/admin-client-layout'
import { UpcyclingClient } from './_components/upcycling-client'

export default async function AdminUpcyclingPage() {
  const upcycling = await api.upcycling.getAll()

  return (
    <AdminClientLayout
      title={`Upcycling Generations (${upcycling?.length ?? 0})`}
      currentPage="Upcycling"
    >
      <UpcyclingClient upcycling={upcycling ?? []} />
    </AdminClientLayout>
  )
}
